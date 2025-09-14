import React, { useState, useMemo } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  Badge,
  Text,
  Flex,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  SimpleGrid,
  Collapse,
  Wrap,
  WrapItem,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  CloseButton,
  Stack,
  FormControl,
  FormLabel,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  CheckboxGroup,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import {
  Search,
  Filter,
  Eye,
  Heart,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  Star,
  Grid3X3,
  List,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const columnHelper = createColumnHelper()

const ProgramsTable = () => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    costCategory: '',
    gradeRange: [9, 12],
    location: '',
    duration: '',
    prestige: '',
    subject: '',
    freeOnly: false,
  })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedProgram, setSelectedProgram] = useState(null)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Fetch programs data
  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      // Use Netlify API endpoint in production, localhost in development
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

  // Filter programs based on current filters
  const filteredPrograms = useMemo(() => {
    return programs.filter(program => {
      // Global search filter
      if (globalFilter) {
        const searchTerm = globalFilter.toLowerCase()
        const searchableText = [
          program.program_name,
          program.organization_name,
          program.description,
          program.location,
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      // Cost category filter
      if (filters.costCategory && program.cost_category !== filters.costCategory) {
        return false
      }

      // Grade range filter
      if (program.grade_level_min && program.grade_level_max) {
        const programMin = parseInt(program.grade_level_min)
        const programMax = parseInt(program.grade_level_max)
        const filterMin = filters.gradeRange[0]
        const filterMax = filters.gradeRange[1]
        
        // Check if there's any overlap between program range and filter range
        if (programMax < filterMin || programMin > filterMax) {
          return false
        }
      }

      // Location filter
      if (filters.location && !program.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }

      // Duration filter
      if (filters.duration && program.duration_weeks !== parseInt(filters.duration)) {
        return false
      }

      // Prestige filter
      if (filters.prestige && program.prestige_level !== filters.prestige) {
        return false
      }

      // Free only filter
      if (filters.freeOnly && !['FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP'].includes(program.cost_category)) {
        return false
      }

      return true
    })
  }, [programs, globalFilter, filters])

  const columns = useMemo(
    () => [
      columnHelper.accessor('program_name', {
        header: 'Program',
        cell: (info) => (
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="sm">
              {info.getValue()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {info.row.original.organization_name}
            </Text>
          </VStack>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('location', {
        header: 'Location',
        cell: (info) => (
          <HStack spacing={1}>
            <MapPin size={12} />
            <Text fontSize="sm">{info.getValue()}</Text>
          </HStack>
        ),
      }),
      columnHelper.display({
        id: 'grade_range',
        header: 'Grade Range',
        cell: (info) => {
          const min = info.row.original.grade_level_min
          const max = info.row.original.grade_level_max
          if (min && max) {
            return (
              <HStack spacing={1}>
                <GraduationCap size={12} />
                <Text fontSize="sm">{min}-{max}</Text>
              </HStack>
            )
          }
          return <Text fontSize="sm" color="gray.400">N/A</Text>
        },
      }),
      columnHelper.accessor('duration_weeks', {
        header: 'Duration',
        cell: (info) => (
          <HStack spacing={1}>
            <Calendar size={12} />
            <Text fontSize="sm">{info.getValue()} weeks</Text>
          </HStack>
        ),
      }),
      columnHelper.accessor('cost_category', {
        header: 'Cost',
        cell: (info) => {
          const cost = info.getValue()
          const colorScheme = {
            'FREE': 'green',
            'FREE_PLUS_STIPEND': 'green',
            'FREE_PLUS_SCHOLARSHIP': 'blue',
            'LOW_COST': 'orange',
            'PAID': 'red'
          }[cost] || 'gray'
          
          return (
            <Badge colorScheme={colorScheme} size="sm">
              {cost.replace('_', ' ')}
            </Badge>
          )
        },
      }),
      columnHelper.accessor('application_deadline', {
        header: 'Deadline',
        cell: (info) => (
          <Text fontSize="sm">
            {info.getValue() ? new Date(info.getValue()).toLocaleDateString() : 'Rolling'}
          </Text>
        ),
      }),
      columnHelper.accessor('prestige_level', {
        header: 'Prestige',
        cell: (info) => {
          const prestige = info.getValue()
          const colorScheme = {
            'elite': 'yellow',
            'highly-selective': 'purple',
            'selective': 'blue',
            'accessible': 'green'
          }[prestige] || 'gray'
          
          return (
            <Badge colorScheme={colorScheme} size="sm">
              <HStack spacing={1}>
                <Star size={10} />
                <Text>{prestige}</Text>
              </HStack>
            </Badge>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <HStack spacing={1}>
            <Tooltip label="View Details">
              <IconButton
                size="sm"
                icon={<Eye size={14} />}
                onClick={() => {
                  setSelectedProgram(info.row.original)
                  onOpen()
                }}
                variant="ghost"
              />
            </Tooltip>
            <Tooltip label="Add to Favorites">
              <IconButton
                size="sm"
                icon={<Heart size={14} />}
                variant="ghost"
                colorScheme="red"
              />
            </Tooltip>
          </HStack>
        ),
      }),
    ],
    [onOpen]
  )

  const table = useReactTable({
    data: filteredPrograms,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const clearAllFilters = () => {
    setGlobalFilter('')
    setFilters({
      costCategory: '',
      gradeRange: [9, 12],
      location: '',
      duration: '',
      prestige: '',
      subject: '',
      freeOnly: false,
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false && !(Array.isArray(value) && value[0] === 9 && value[1] === 12)
  ).length + (globalFilter ? 1 : 0)

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justify="center" align="center" h="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="brand.500" />
            <Text>Loading programs...</Text>
          </VStack>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          Failed to load programs. Please try again.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Advanced Filters */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              {/* Search and Basic Controls */}
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={4}
                w="full"
                align={{ base: 'stretch', md: 'center' }}
              >
                <InputGroup flex={1}>
                  <InputLeftElement>
                    <Search size={16} color="gray" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search programs, organizations, locations..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    size="md"
                  />
                  {globalFilter && (
                    <InputRightElement>
                      <CloseButton size="sm" onClick={() => setGlobalFilter('')} />
                    </InputRightElement>
                  )}
                </InputGroup>
                
                <HStack spacing={2}>
                  <Button
                    leftIcon={<Settings size={16} />}
                    size="sm"
                    variant={showAdvancedFilters ? 'solid' : 'outline'}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>
                  
                  <Button
                    leftIcon={<TableIcon size={16} />}
                    size="sm"
                    variant={viewMode === 'table' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('table')}
                  >
                    Table
                  </Button>
                  <Button
                    leftIcon={<Grid3X3 size={16} />}
                    size="sm"
                    variant={viewMode === 'cards' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('cards')}
                  >
                    Cards
                  </Button>
                  <Button
                    leftIcon={<List size={16} />}
                    size="sm"
                    variant={viewMode === 'list' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </HStack>
              </Flex>

              {/* Advanced Filters */}
              <Collapse in={showAdvancedFilters} animateOpacity>
                <Box w="full" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                  <VStack spacing={4} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold">Advanced Filters</Text>
                      <Button size="sm" variant="ghost" onClick={clearAllFilters}>
                        Clear All
                      </Button>
                    </Flex>
                    
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {/* Cost Category */}
                      <FormControl>
                        <FormLabel fontSize="sm">Cost Category</FormLabel>
                        <Select
                          placeholder="All costs"
                          value={filters.costCategory}
                          onChange={(e) => setFilters(prev => ({ ...prev, costCategory: e.target.value }))}
                          size="sm"
                        >
                          <option value="FREE">Free</option>
                          <option value="FREE_PLUS_STIPEND">Free + Stipend</option>
                          <option value="FREE_PLUS_SCHOLARSHIP">Scholarship</option>
                          <option value="LOW_COST">Low Cost</option>
                          <option value="PAID">Paid</option>
                        </Select>
                      </FormControl>

                      {/* Grade Range */}
                      <FormControl>
                        <FormLabel fontSize="sm">Grade Range</FormLabel>
                        <VStack spacing={2}>
                          <RangeSlider
                            value={filters.gradeRange}
                            onChange={(val) => setFilters(prev => ({ ...prev, gradeRange: val }))}
                            min={6}
                            max={16}
                            step={1}
                            size="sm"
                          >
                            <RangeSliderTrack>
                              <RangeSliderFilledTrack />
                            </RangeSliderTrack>
                            <RangeSliderThumb index={0} />
                            <RangeSliderThumb index={1} />
                          </RangeSlider>
                          <Text fontSize="xs" color="gray.600">
                            Grades {filters.gradeRange[0]}-{filters.gradeRange[1]}
                          </Text>
                        </VStack>
                      </FormControl>

                      {/* Location */}
                      <FormControl>
                        <FormLabel fontSize="sm">Location</FormLabel>
                        <Input
                          placeholder="City, State, or Country"
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          size="sm"
                        />
                      </FormControl>

                      {/* Duration */}
                      <FormControl>
                        <FormLabel fontSize="sm">Duration (weeks)</FormLabel>
                        <NumberInput
                          value={filters.duration}
                          onChange={(value) => setFilters(prev => ({ ...prev, duration: value }))}
                          size="sm"
                        >
                          <NumberInputField placeholder="Any duration" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      {/* Prestige Level */}
                      <FormControl>
                        <FormLabel fontSize="sm">Prestige Level</FormLabel>
                        <Select
                          placeholder="All levels"
                          value={filters.prestige}
                          onChange={(e) => setFilters(prev => ({ ...prev, prestige: e.target.value }))}
                          size="sm"
                        >
                          <option value="elite">🏆 Elite</option>
                          <option value="highly-selective">⭐ Highly Selective</option>
                          <option value="selective">📚 Selective</option>
                          <option value="accessible">🌟 Accessible</option>
                        </Select>
                      </FormControl>

                      {/* Free Only Toggle */}
                      <FormControl>
                        <FormLabel fontSize="sm">Free Programs Only</FormLabel>
                        <Switch
                          isChecked={filters.freeOnly}
                          onChange={(e) => setFilters(prev => ({ ...prev, freeOnly: e.target.checked }))}
                          colorScheme="green"
                        />
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                </Box>
              </Collapse>

              {/* Results Count */}
              <Text fontSize="sm" color="gray.600">
                Showing {filteredPrograms.length} of {programs.length} programs
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Data Display */}
        {viewMode === 'table' && (
          <Card>
            <CardBody p={0}>
              <Box overflowX="auto">
                <Box as="table" w="full">
                  <Box as="thead" bg={useColorModeValue('gray.50', 'gray.700')}>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Box as="tr" key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Box
                            as="th"
                            key={header.id}
                            px={4}
                            py={3}
                            textAlign="left"
                            fontSize="sm"
                            fontWeight="bold"
                            color="gray.600"
                            borderBottom="1px"
                            borderColor={borderColor}
                            cursor={header.column.getCanSort() ? 'pointer' : 'default'}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {header.column.getIsSorted() === 'asc' && ' ↑'}
                            {header.column.getIsSorted() === 'desc' && ' ↓'}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                  <Box as="tbody">
                    {table.getRowModel().rows.map((row) => (
                      <Box
                        as="tr"
                        key={row.id}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        transition="background-color 0.2s"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Box
                            as="td"
                            key={cell.id}
                            px={4}
                            py={3}
                            borderBottom="1px"
                            borderColor={borderColor}
                            fontSize="sm"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </Box>
                        ))}
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
            {filteredPrograms.map((program) => (
              <Card key={program.id} _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }} transition="all 0.2s">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <VStack spacing={1} align="start">
                      <Text fontWeight="bold" fontSize="lg" noOfLines={2}>
                        {program.program_name}
                      </Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {program.organization_name}
                      </Text>
                    </VStack>
                    
                    <Text fontSize="sm" color="gray.700" noOfLines={3}>
                      {program.description}
                    </Text>
                    
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <HStack spacing={1}>
                          <MapPin size={12} />
                          <Text fontSize="xs">{program.location}</Text>
                        </HStack>
                        <HStack spacing={1}>
                          <Calendar size={12} />
                          <Text fontSize="xs">{program.duration_weeks}w</Text>
                        </HStack>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <HStack spacing={1}>
                          <GraduationCap size={12} />
                          <Text fontSize="xs">
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
                          size="sm"
                        >
                          {program.cost_category?.replace('_', ' ')}
                        </Badge>
                      </HStack>
                    </VStack>
                    
                    <HStack justify="space-between">
                      <Button
                        size="sm"
                        leftIcon={<Eye size={14} />}
                        onClick={() => {
                          setSelectedProgram(program)
                          onOpen()
                        }}
                        variant="outline"
                      >
                        View Details
                      </Button>
                      <IconButton
                        size="sm"
                        icon={<Heart size={14} />}
                        variant="ghost"
                        colorScheme="red"
                      />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <VStack spacing={2} align="stretch">
            {filteredPrograms.map((program) => (
              <Card key={program.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }} transition="all 0.2s">
                <CardBody py={3}>
                  <Flex justify="space-between" align="center">
                    <VStack spacing={1} align="start" flex={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {program.program_name}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {program.organization_name} • {program.location}
                      </Text>
                    </VStack>
                    
                    <HStack spacing={4}>
                      <Text fontSize="xs" color="gray.600">
                        {program.grade_level_min && program.grade_level_max 
                          ? `Grades ${program.grade_level_min}-${program.grade_level_max}`
                          : 'N/A'
                        }
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {program.duration_weeks} weeks
                      </Text>
                      <Badge 
                        colorScheme={
                          program.cost_category === 'FREE' ? 'green' :
                          program.cost_category === 'PAID' ? 'red' : 'orange'
                        } 
                        size="sm"
                      >
                        {program.cost_category?.replace('_', ' ')}
                      </Badge>
                      <HStack spacing={1}>
                        <Button
                          size="xs"
                          leftIcon={<Eye size={12} />}
                          onClick={() => {
                            setSelectedProgram(program)
                            onOpen()
                          }}
                          variant="ghost"
                        >
                          View
                        </Button>
                        <IconButton
                          size="xs"
                          icon={<Heart size={12} />}
                          variant="ghost"
                          colorScheme="red"
                        />
                      </HStack>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}

        {/* Pagination */}
        {filteredPrograms.length > 0 && (
          <Flex justify="center" align="center" gap={4}>
            <Button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              size="sm"
            >
              First
            </Button>
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              size="sm"
            >
              Previous
            </Button>
            <Text fontSize="sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </Text>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              size="sm"
            >
              Next
            </Button>
            <Button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              size="sm"
            >
              Last
            </Button>
          </Flex>
        )}
      </VStack>

      {/* Program Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProgram?.program_name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedProgram && (
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold" color="brand.500">
                  {selectedProgram.organization_name}
                </Text>
                <Text>{selectedProgram.description}</Text>
                
                <Divider />
                
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                      Location
                    </Text>
                    <Text>{selectedProgram.location}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                      Grade Range
                    </Text>
                    <Text>
                      {selectedProgram.grade_level_min && selectedProgram.grade_level_max 
                        ? `${selectedProgram.grade_level_min}-${selectedProgram.grade_level_max}`
                        : 'N/A'
                      }
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                      Duration
                    </Text>
                    <Text>{selectedProgram.duration_weeks} weeks</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.600">
                      Application Deadline
                    </Text>
                    <Text>
                      {selectedProgram.application_deadline 
                        ? new Date(selectedProgram.application_deadline).toLocaleDateString()
                        : 'Rolling'
                      }
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default ProgramsTable