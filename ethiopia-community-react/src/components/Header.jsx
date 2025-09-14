import React from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Spinner,
} from '@chakra-ui/react'
import { Sun, Flag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const Header = () => {
  const bgGradient = 'linear(to-r, brand.600, ethiopian.green, ethiopian.red)'

  // Fetch stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['programs-stats'],
    queryFn: async () => {
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/programs/stats'
        : '/api/programs/stats'
      
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  return (
    <Box
      bgGradient={bgGradient}
      color="white"
      py={8}
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.1}
        bg="rgba(255,255,255,0.1)"
      />
      
      <Container maxW="container.xl" position="relative" zIndex={1}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justify="space-between"
          gap={6}
        >
          <VStack align={{ base: 'center', md: 'start' }} spacing={2}>
            <HStack spacing={3}>
              <Sun size={32} />
              <Heading size="lg" fontWeight="bold">
                🇪🇹 🇪🇷 Ethiopian & Eritrean Summer Programs
              </Heading>
            </HStack>
            <Text fontSize="lg" opacity={0.9} textAlign={{ base: 'center', md: 'left' }}>
              የክረምት ፕሮግራሞች - Discover amazing opportunities for Ethiopian and Eritrean students
            </Text>
          </VStack>
          
          <HStack spacing={4} flexWrap="wrap" justify="center">
            {isLoading ? (
              <Spinner color="white" size="sm" />
            ) : (
              <>
                <VStack spacing={1}>
                  <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="full">
                    {stats?.data?.statistics?.totalPrograms || 0} Programs
                  </Badge>
                  <Text fontSize="xs" opacity={0.8}>Total Available</Text>
                </VStack>
                <VStack spacing={1}>
                  <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                    {stats?.data?.statistics?.freePrograms || 0} Free
                  </Badge>
                  <Text fontSize="xs" opacity={0.8}>No Cost</Text>
                </VStack>
                <VStack spacing={1}>
                  <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                    {stats?.data?.statistics?.topSubjects?.length || 0}+ Subjects
                  </Badge>
                  <Text fontSize="xs" opacity={0.8}>Areas</Text>
                </VStack>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}

export default Header

