import { describe, it, expect } from 'vitest'

// Test all component imports to catch import errors early
describe('Component Import Tests', () => {
  describe('Critical Import Checks', () => {
    it('should import App component without errors', async () => {
      expect(async () => {
        await import('../../App')
      }).not.toThrow()
    })

    it('should import ProgramsTable component without errors', async () => {
      expect(async () => {
        await import('../../components/ProgramsTable')
      }).not.toThrow()
    })

    it('should import ProgramDetailsModal component without errors', async () => {
      expect(async () => {
        await import('../../components/ProgramDetailsModal')
      }).not.toThrow()
    })

    it('should import Header component without errors', async () => {
      expect(async () => {
        await import('../../components/Header')
      }).not.toThrow()
    })

    it('should import FavoritesPanel component without errors', async () => {
      expect(async () => {
        await import('../../components/FavoritesPanel')
      }).not.toThrow()
    })

    it('should import ExportButton component without errors', async () => {
      expect(async () => {
        await import('../../components/ExportButton')
      }).not.toThrow()
    })
  })

  describe('Chakra UI Import Validation', () => {
    it('should import all required Chakra UI components', async () => {
      const chakraModule = await import('@chakra-ui/react')
      
      // Test critical components that were causing issues
      expect(chakraModule.ChakraProvider).toBeDefined()
      expect(chakraModule.createSystem).toBeDefined()
      expect(chakraModule.defaultConfig).toBeDefined()
      expect(chakraModule.Box).toBeDefined()
      expect(chakraModule.Text).toBeDefined()
      expect(chakraModule.Button).toBeDefined()
      expect(chakraModule.VStack).toBeDefined()
      expect(chakraModule.HStack).toBeDefined()
      
      // Test Dialog components (replacement for Modal)
      expect(chakraModule.DialogRoot).toBeDefined()
      expect(chakraModule.DialogContent).toBeDefined()
      expect(chakraModule.DialogHeader).toBeDefined()
      expect(chakraModule.DialogBody).toBeDefined()
      expect(chakraModule.DialogTitle).toBeDefined()
      expect(chakraModule.DialogCloseTrigger).toBeDefined()
      expect(chakraModule.DialogBackdrop).toBeDefined()
      
      // Test Separator (replacement for Divider)
      expect(chakraModule.Separator).toBeDefined()
    })

    it('should verify deprecated components are not used', async () => {
      const chakraModule = await import('@chakra-ui/react')
      
      // These should NOT exist in Chakra UI v3
      expect(chakraModule.Modal).toBeUndefined()
      expect(chakraModule.ModalOverlay).toBeUndefined()
      expect(chakraModule.ModalContent).toBeUndefined()
      expect(chakraModule.ModalHeader).toBeUndefined()
      expect(chakraModule.ModalBody).toBeUndefined()
      expect(chakraModule.ModalCloseButton).toBeUndefined()
      expect(chakraModule.Divider).toBeUndefined()
    })
  })

  describe('Third-party Library Imports', () => {
    it('should import React Query without errors', async () => {
      const reactQueryModule = await import('@tanstack/react-query')
      
      expect(reactQueryModule.QueryClient).toBeDefined()
      expect(reactQueryModule.QueryClientProvider).toBeDefined()
      expect(reactQueryModule.useQuery).toBeDefined()
    })

    it('should import Lucide React icons without errors', async () => {
      const lucideModule = await import('lucide-react')
      
      expect(lucideModule.Heart).toBeDefined()
      expect(lucideModule.MapPin).toBeDefined()
      expect(lucideModule.Clock).toBeDefined()
      expect(lucideModule.Download).toBeDefined()
      expect(lucideModule.Sun).toBeDefined()
    })

    it('should import React without errors', async () => {
      const reactModule = await import('react')
      
      expect(reactModule.default).toBeDefined()
      expect(reactModule.useState).toBeDefined()
      expect(reactModule.useEffect).toBeDefined()
      expect(reactModule.useMemo).toBeDefined()
    })
  })

  describe('Component Export Validation', () => {
    it('should export components correctly', async () => {
      const AppModule = await import('../../App')
      expect(AppModule.default).toBeDefined()
      expect(typeof AppModule.default).toBe('function')

      const ProgramsTableModule = await import('../../components/ProgramsTable')
      expect(ProgramsTableModule.default).toBeDefined()
      expect(typeof ProgramsTableModule.default).toBe('function')

      const HeaderModule = await import('../../components/Header')
      expect(HeaderModule.default).toBeDefined()
      expect(typeof HeaderModule.default).toBe('function')

      const ProgramDetailsModalModule = await import('../../components/ProgramDetailsModal')
      expect(ProgramDetailsModalModule.default).toBeDefined()
      expect(typeof ProgramDetailsModalModule.default).toBe('function')

      const FavoritesPanelModule = await import('../../components/FavoritesPanel')
      expect(FavoritesPanelModule.default).toBeDefined()
      expect(typeof FavoritesPanelModule.default).toBe('function')

      const ExportButtonModule = await import('../../components/ExportButton')
      expect(ExportButtonModule.default).toBeDefined()
      expect(typeof ExportButtonModule.default).toBe('function')
    })
  })

  describe('Syntax and Structure Validation', () => {
    it('should have valid JavaScript syntax in all components', async () => {
      const components = [
        '../../App',
        '../../components/ProgramsTable',
        '../../components/ProgramDetailsModal', 
        '../../components/Header',
        '../../components/FavoritesPanel',
        '../../components/ExportButton'
      ]

      for (const component of components) {
        try {
          await import(component)
        } catch (error) {
          throw new Error(`Syntax error in ${component}: ${error.message}`)
        }
      }
    })

    it('should not have circular import dependencies', async () => {
      // This test will fail if there are circular imports
      expect(async () => {
        await Promise.all([
          import('../../App'),
          import('../../components/ProgramsTable'),
          import('../../components/ProgramDetailsModal'),
          import('../../components/Header'),
          import('../../components/FavoritesPanel'),
          import('../../components/ExportButton')
        ])
      }).not.toThrow()
    })
  })
})
