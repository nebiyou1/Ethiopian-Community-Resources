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

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.user = session.user;
                this.updateUI(true);
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

    async signOut() {
        if (!this.supabase) return;

        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) {
                console.error('❌ Sign-out failed:', error);
            }
        } catch (error) {
            console.error('❌ Sign-out error:', error);
        }
    }

    updateUI(isSignedIn) {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const userInfo = document.getElementById('userInfo');

        if (isSignedIn && this.user) {
            // Show signed-in state
            if (signInBtn) signInBtn.style.display = 'none';
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
            if (signInBtn) signInBtn.style.display = 'inline-block';
            if (signOutBtn) signOutBtn.style.display = 'none';
            if (userInfo) {
                userInfo.innerHTML = '';
                userInfo.style.display = 'none';
            }
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.getElementById('authError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'authError';
            errorDiv.className = 'auth-error';
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
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

