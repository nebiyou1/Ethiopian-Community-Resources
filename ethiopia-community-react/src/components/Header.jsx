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
  useColorModeValue,
} from '@chakra-ui/react'
import { Sun, Flag } from 'lucide-react'

const Header = () => {
  const bgGradient = useColorModeValue(
    'linear(to-r, brand.600, ethiopian.green, ethiopian.red)',
    'linear(to-r, brand.700, ethiopian.green, ethiopian.red)'
  )

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
        backgroundImage="url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"white\"/><circle cx=\"80\" cy=\"80\" r=\"2\" fill=\"white\"/><circle cx=\"40\" cy=\"60\" r=\"1\" fill=\"white\"/><circle cx=\"60\" cy=\"40\" r=\"1\" fill=\"white\"/></svg>')"
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
            <VStack spacing={1}>
              <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="full">
                176+ Programs
              </Badge>
              <Text fontSize="xs" opacity={0.8}>Total Available</Text>
            </VStack>
            <VStack spacing={1}>
              <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                37 Free
              </Badge>
              <Text fontSize="xs" opacity={0.8}>No Cost</Text>
            </VStack>
            <VStack spacing={1}>
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full">
                15+ Subjects
              </Badge>
              <Text fontSize="xs" opacity={0.8}>Areas</Text>
            </VStack>
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}

export default Header

