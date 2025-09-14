// Supabase Auth Integration for Google Sign-in
// This file handles authentication using Supabase Auth

class AuthManager {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Initialize Supabase client
            const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
            
            this.supabase = createClient(
                'https://qvqybobnsaikaknsdqhw.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y'
            );

            // Check for existing demo user session
            const demoUser = sessionStorage.getItem('demo_user');
            if (demoUser) {
                this.user = JSON.parse(demoUser);
                this.updateUI(true);
                console.log('👤 Demo user restored:', this.user.email);
            } else {
                // Check for existing Supabase session
                const { data: { session } } = await this.supabase.auth.getSession();
                if (session) {
                    this.user = session.user;
                    this.updateUI(true);
                }
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    this.user = session.user;
                    this.updateUI(true);
                    console.log('✅ User signed in:', this.user.email);
                } else if (event === 'SIGNED_OUT') {
                    this.user = null;
                    this.updateUI(false);
                    console.log('👋 User signed out');
                }
            });

            this.isInitialized = true;
            console.log('🔐 Auth Manager initialized');
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
        }
    }

    async signInWithGoogle() {
        if (!this.supabase) {
            await this.init();
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) {
                console.error('❌ Google sign-in failed:', error);
                this.showError('Sign-in failed. Please try again.');
            }
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            this.showError('Sign-in failed. Please try again.');
        }
    }

    async sendVerificationCode(email) {
        if (!this.supabase) {
            await this.init();
        }

        try {
            // Generate a 6-digit verification code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store the code temporarily (in a real app, you'd store this in a database)
            sessionStorage.setItem('verification_code', code);
            sessionStorage.setItem('verification_email', email);
            sessionStorage.setItem('verification_timestamp', Date.now().toString());
            
            // For demo purposes, we'll show the code in console and alert
            // In production, this would be sent via email service
            console.log(`🔐 Verification code for ${email}: ${code}`);
            
            // Simulate email sending with a delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show the code to user for demo purposes
            alert(`Demo: Your verification code is ${code}\n\nIn production, this would be sent to your email.`);

            console.log('✅ Verification code generated for:', email);
            return { success: true };
        } catch (error) {
            console.error('❌ Send verification code error:', error);
            this.showError('Failed to send verification code. Please try again.');
            return { success: false, error: error.message };
        }
    }

    async verifyCode(email, code) {
        if (!this.supabase) {
            await this.init();
        }

        try {
            // Check if the code matches and is not expired (5 minutes)
            const storedCode = sessionStorage.getItem('verification_code');
            const storedEmail = sessionStorage.getItem('verification_email');
            const storedTimestamp = parseInt(sessionStorage.getItem('verification_timestamp'));
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            if (!storedCode || !storedEmail || !storedTimestamp) {
                throw new Error('No verification code found. Please request a new one.');
            }

            if (storedEmail !== email) {
                throw new Error('Email does not match. Please use the same email address.');
            }

            if (now - storedTimestamp > fiveMinutes) {
                sessionStorage.removeItem('verification_code');
                sessionStorage.removeItem('verification_email');
                sessionStorage.removeItem('verification_timestamp');
                throw new Error('Verification code has expired. Please request a new one.');
            }

            if (storedCode !== code) {
                throw new Error('Invalid verification code. Please check and try again.');
            }

            // Code is valid, create a mock user session
            const mockUser = {
                id: 'demo-user-' + Date.now(),
                email: email,
                user_metadata: {
                    full_name: email.split('@')[0],
                    avatar_url: null
                },
                created_at: new Date().toISOString()
            };

            // Store user in session
            sessionStorage.setItem('demo_user', JSON.stringify(mockUser));
            
            // Clean up stored verification data
            sessionStorage.removeItem('verification_code');
            sessionStorage.removeItem('verification_email');
            sessionStorage.removeItem('verification_timestamp');

            // Update UI
            this.user = mockUser;
            this.updateUI(true);

            console.log('✅ Code verification successful:', email);
            return { success: true, data: { user: mockUser } };
        } catch (error) {
            console.error('❌ Code verification error:', error);
            this.showError(error.message);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            // Clear demo user session
            sessionStorage.removeItem('demo_user');
            
            // Sign out from Supabase if there's a session
            if (this.supabase) {
                const { error } = await this.supabase.auth.signOut();
                if (error) {
                    console.error('❌ Supabase sign-out failed:', error);
                }
            }
            
            // Update UI
            this.user = null;
            this.updateUI(false);
            console.log('👋 User signed out');
        } catch (error) {
            console.error('❌ Sign-out error:', error);
        }
    }

    updateUI(isSignedIn) {
        const authToggleBtn = document.getElementById('authToggleBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const userInfo = document.getElementById('userInfo');

        if (isSignedIn && this.user) {
            // Show signed-in state
            if (authToggleBtn) authToggleBtn.style.display = 'none';
            if (signOutBtn) signOutBtn.style.display = 'inline-block';
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="user-profile">
                        <img src="${this.user.user_metadata?.avatar_url || '/default-avatar.png'}" 
                             alt="Profile" class="user-avatar">
                        <span class="user-name">${this.user.user_metadata?.full_name || this.user.email}</span>
                    </div>
                `;
                userInfo.style.display = 'block';
            }
        } else {
            // Show signed-out state
            if (authToggleBtn) authToggleBtn.style.display = 'inline-block';
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (userInfo) {
                userInfo.innerHTML = '';
                userInfo.style.display = 'none';
            }
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        // Create or update message
        let messageDiv = document.getElementById('authMessage');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'authMessage';
            messageDiv.className = 'auth-message';
            document.body.appendChild(messageDiv);
        }
        
        messageDiv.textContent = message;
        messageDiv.className = `auth-message auth-${type}`;
        messageDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    isAuthenticated() {
        return this.user !== null;
    }

    getCurrentUser() {
        return this.user;
    }
}

// Initialize auth manager
window.authManager = new AuthManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager.init();
});

