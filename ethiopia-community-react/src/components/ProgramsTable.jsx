import React, { useState, useMemo } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Flex,
  Spinner,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'

const ProgramsTable = () => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    costCategory: '',
    location: '',
    prestige: '',
  })

  // Fetch programs data
  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/programs'
        : '/api/programs'
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.programs || []
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
  })

  // Filter programs
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      // Global search filter
      if (globalFilter) {
        const searchTerm = globalFilter.toLowerCase()
        const searchableText = [
          program.program_name,
          program.organization?.name,
          program.location,
          program.subject_area
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      // Cost category filter
      if (filters.costCategory && program.cost_category !== filters.costCategory) {
        return false
      }

      // Location filter
      if (filters.location && !program.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }

      // Prestige filter
      if (filters.prestige && program.prestige_level !== filters.prestige) {
        return false
      }

      return true
    })
  }, [programs, globalFilter, filters])

  const clearAllFilters = () => {
    setGlobalFilter('')
    setFilters({
      costCategory: '',
      location: '',
      prestige: '',
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== ''
  ).length + (globalFilter ? 1 : 0)

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text fontSize="lg" color="gray.600">Loading programs...</Text>
          </VStack>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box 
          p={6} 
          bg="red.50" 
          border="1px" 
          borderColor="red.200" 
          borderRadius="lg"
          textAlign="center"
        >
          <Text fontSize="lg" color="red.600" fontWeight="bold">
            ⚠️ Failed to load programs
          </Text>
          <Text fontSize="sm" color="red.500" mt={2}>
            Please check your connection and try again.
          </Text>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="gray.800" mb={2}>
            🎓 Summer Programs
          </Text>
          <Text fontSize="lg" color="gray.600">
            Discover amazing opportunities for students
          </Text>
        </Box>

        {/* Filters Card */}
        <Card shadow="lg" borderRadius="xl">
          <CardBody p={6}>
            <VStack spacing={6}>
              {/* Search and Controls */}
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={4}
                w="full"
                align={{ base: 'stretch', md: 'center' }}
              >
                <HStack flex={1} spacing={3}>
                  <Text fontSize="lg" color="blue.500">🔍</Text>
                  <Input
                    placeholder="Search programs, organizations, locations..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    size="lg"
                    flex={1}
                    borderRadius="lg"
                    borderColor="gray.300"
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                  />
                  {globalFilter && (
                    <Button 
                      size="lg" 
                      variant="ghost" 
                      onClick={() => setGlobalFilter('')}
                      borderRadius="lg"
                    >
                      ✕
                    </Button>
                  )}
                </HStack>
                
                <HStack spacing={3}>
                  <Button
                    size="lg"
                    variant={showAdvancedFilters ? 'solid' : 'outline'}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    borderRadius="lg"
                    colorScheme="blue"
                  >
                    ⚙️ Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>
                  
                  <Button
                    size="lg"
                    variant={viewMode === 'table' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('table')}
                    borderRadius="lg"
                    colorScheme="blue"
                  >
                    📊 Table
                  </Button>
                  <Button
                    size="lg"
                    variant={viewMode === 'cards' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('cards')}
                    borderRadius="lg"
                    colorScheme="blue"
                  >
                    🃏 Cards
                  </Button>
                </HStack>
              </Flex>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <Box w="full">
                  <VStack spacing={6}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                      {/* Cost Category */}
                      <Box>
                        <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                          💰 Cost Category
                        </Text>
                        <VStack spacing={2} align="stretch">
                          {['FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP', 'LOW_COST', 'PAID'].map(cost => (
                            <Button
                              key={cost}
                              size="sm"
                              variant={filters.costCategory === cost ? 'solid' : 'outline'}
                              onClick={() => setFilters(prev => ({ 
                                ...prev, 
                                costCategory: prev.costCategory === cost ? '' : cost 
                              }))}
                              justifyContent="flex-start"
                              borderRadius="md"
                              colorScheme={filters.costCategory === cost ? 'blue' : 'gray'}
                            >
                              {cost === 'FREE' && '🆓 Free'}
                              {cost === 'FREE_PLUS_STIPEND' && '💰 Free + Stipend'}
                              {cost === 'FREE_PLUS_SCHOLARSHIP' && '🎓 Free + Scholarship'}
                              {cost === 'LOW_COST' && '💵 Low Cost'}
                              {cost === 'PAID' && '💸 Paid'}
                            </Button>
                          ))}
                        </VStack>
                      </Box>

                      {/* Location */}
                      <Box>
                        <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                          📍 Location
                        </Text>
                        <Input
                          placeholder="Search location..."
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          size="md"
                          borderRadius="md"
                        />
                      </Box>

                      {/* Prestige Level */}
                      <Box>
                        <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                          🏆 Prestige Level
                        </Text>
                        <VStack spacing={2} align="stretch">
                          {[
                            { value: 'elite', label: '🏆 Elite' },
                            { value: 'highly-selective', label: '⭐ Highly Selective' },
                            { value: 'selective', label: '📚 Selective' },
                            { value: 'accessible', label: '🌟 Accessible' }
                          ].map(prestige => (
                            <Button
                              key={prestige.value}
                              size="sm"
                              variant={filters.prestige === prestige.value ? 'solid' : 'outline'}
                              onClick={() => setFilters(prev => ({ 
                                ...prev, 
                                prestige: prev.prestige === prestige.value ? '' : prestige.value 
                              }))}
                              justifyContent="flex-start"
                              borderRadius="md"
                              colorScheme={filters.prestige === prestige.value ? 'blue' : 'gray'}
                            >
                              {prestige.label}
                            </Button>
                          ))}
                        </VStack>
                      </Box>
                    </SimpleGrid>
                    
                    <Button 
                      size="md" 
                      variant="ghost" 
                      onClick={clearAllFilters}
                      colorScheme="red"
                    >
                      🗑️ Clear All Filters
                    </Button>
                  </VStack>
                </Box>
              )}

              {/* Results Count */}
              <Box textAlign="center">
                <Text fontSize="lg" color="gray.600" fontWeight="medium">
                  Showing <Text as="span" fontWeight="bold" color="blue.600">{filteredPrograms.length}</Text> of <Text as="span" fontWeight="bold" color="blue.600">{programs.length}</Text> programs
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Data Display */}
        {viewMode === 'table' && (
          <Card shadow="lg" borderRadius="xl">
            <CardBody p={0}>
              <Box overflowX="auto">
                <Box as="table" w="full">
                  <Box as="thead" bg="gray.50">
                    <Box as="tr">
                      <Box as="th" px={6} py={4} textAlign="left" fontSize="md" fontWeight="bold" color="gray.700" borderBottom="2px" borderColor="gray.200">
                        Program
                      </Box>
                      <Box as="th" px={6} py={4} textAlign="left" fontSize="md" fontWeight="bold" color="gray.700" borderBottom="2px" borderColor="gray.200">
                        Organization
                      </Box>
                      <Box as="th" px={6} py={4} textAlign="left" fontSize="md" fontWeight="bold" color="gray.700" borderBottom="2px" borderColor="gray.200">
                        Location
                      </Box>
                      <Box as="th" px={6} py={4} textAlign="left" fontSize="md" fontWeight="bold" color="gray.700" borderBottom="2px" borderColor="gray.200">
                        Duration
                      </Box>
                      <Box as="th" px={6} py={4} textAlign="left" fontSize="md" fontWeight="bold" color="gray.700" borderBottom="2px" borderColor="gray.200">
                        Cost
                      </Box>
                      <Box as="th" px={6} py={4} textAlign="left" fontSize="md" fontWeight="bold" color="gray.700" borderBottom="2px" borderColor="gray.200">
                        Actions
                      </Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {filteredPrograms.map((program, index) => (
                      <Box
                        as="tr"
                        key={program.id || index}
                        _hover={{ bg: 'blue.50' }}
                        transition="background-color 0.2s"
                        borderBottom="1px"
                        borderColor="gray.100"
                      >
                        <Box as="td" px={6} py={4} fontSize="sm">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" fontSize="md" color="gray.800">
                              {String(program.program_name || 'Unknown Program')}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {String(program.organization?.name || 'Unknown Organization')}
                            </Text>
                          </VStack>
                        </Box>
                        <Box as="td" px={6} py={4} fontSize="sm">
                          <Text fontSize="sm" color="gray.700">{String(program.organization?.name || 'Unknown')}</Text>
                        </Box>
                        <Box as="td" px={6} py={4} fontSize="sm">
                          <HStack spacing={2}>
                            <Text fontSize="sm">📍</Text>
                            <Text fontSize="sm" color="gray.700">
                              {program.location || 
                               (program.organization ? 
                                 [program.organization.city, program.organization.state, program.organization.country]
                                   .filter(Boolean).join(', ') || 'Various' : 
                                 'Various')}
                            </Text>
                          </HStack>
                        </Box>
                        <Box as="td" px={6} py={4} fontSize="sm">
                          <HStack spacing={2}>
                            <Text fontSize="sm">📅</Text>
                            <Text fontSize="sm" color="gray.700">
                              {program.duration_weeks ? `${String(program.duration_weeks)} weeks` : 'N/A'}
                            </Text>
                          </HStack>
                        </Box>
                        <Box as="td" px={6} py={4} fontSize="sm">
                          <Badge 
                            colorScheme={
                              program.cost_category === 'FREE' ? 'green' :
                              program.cost_category === 'PAID' ? 'red' : 'orange'
                            } 
                            size="md"
                            borderRadius="md"
                          >
                            {String(program.cost_category || 'Unknown').replace('_', ' ')}
                          </Badge>
                        </Box>
                        <Box as="td" px={6} py={4} fontSize="sm">
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              onClick={() => console.log('View program:', program)}
                              variant="outline"
                              colorScheme="blue"
                              borderRadius="md"
                            >
                              👁️ View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              borderRadius="md"
                            >
                              ❤️
                            </Button>
                          </HStack>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Cards View */}
        {viewMode === 'cards' && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredPrograms.map((program, index) => (
              <Card key={program.id || index} shadow="lg" borderRadius="xl" _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }} transition="all 0.2s">
                <CardBody p={6}>
                  <VStack align="stretch" spacing={4}>
                    <VStack align="start" spacing={3}>
                      <Text fontWeight="bold" fontSize="xl" color="gray.800">
                        {String(program.program_name || 'Unknown Program')}
                      </Text>
                      <Text fontSize="md" color="gray.600">
                        {String(program.organization?.name || 'Unknown Organization')}
                      </Text>
                      <Text fontSize="sm" color="gray.500" noOfLines={3}>
                        {program.description || 'No description available'}
                      </Text>
                    </VStack>
                    
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <HStack spacing={2}>
                          <Text fontSize="sm">📍</Text>
                          <Text fontSize="sm" color="gray.700">
                            {program.location || 
                             (program.organization ? 
                               [program.organization.city, program.organization.state, program.organization.country]
                                 .filter(Boolean).join(', ') || 'Various' : 
                               'Various')}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Text fontSize="sm">📅</Text>
                          <Text fontSize="sm" color="gray.700">
                            {program.duration_weeks ? `${String(program.duration_weeks)}w` : 'N/A'}
                          </Text>
                        </HStack>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <HStack spacing={2}>
                          <Text fontSize="sm">🎓</Text>
                          <Text fontSize="sm" color="gray.700">
                            {program.grade_level_min && program.grade_level_max 
                              ? `${program.grade_level_min}-${program.grade_level_max}`
                              : 'N/A'
                            }
                          </Text>
                        </HStack>
                        <Badge 
                          colorScheme={
                            program.cost_category === 'FREE' ? 'green' :
                            program.cost_category === 'PAID' ? 'red' : 'orange'
                          } 
                          size="md"
                          borderRadius="md"
                        >
                          {String(program.cost_category || 'Unknown').replace('_', ' ')}
                        </Badge>
                      </HStack>
                    </VStack>
                    
                    <HStack justify="space-between" pt={2}>
                      <Button
                        size="md"
                        onClick={() => console.log('View program:', program)}
                        variant="solid"
                        colorScheme="blue"
                        borderRadius="md"
                        flex={1}
                      >
                        👁️ View Details
                      </Button>
                      <Button
                        size="md"
                        variant="outline"
                        colorScheme="red"
                        borderRadius="md"
                      >
                        ❤️
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  )
}

export default ProgramsTable