import { useState, useRef, useEffect } from 'react'
import { useLeRobotStore } from '../store/lerobotStore'
import { toast } from 'react-hot-toast'
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

// Extend Window interface for global variable
declare global {
  interface Window {
    calibrationContinueResolve?: () => void
    calibrationProcess?: any
  }
}

interface CalibrationStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'waiting-user'
  userPrompt?: string
}

interface RobotType {
  id: string
  name: string
  description: string
  calibrationSteps: CalibrationStep[]
}

// Backend API configuration
const BACKEND_URL = 'http://localhost:8000'

export default function Calibration() {
  const { armConfig } = useLeRobotStore()
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedArm, setSelectedArm] = useState<'leader' | 'follower'>('leader')
  const [calibrationOutput, setCalibrationOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [waitingForUser, setWaitingForUser] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [websocket, setWebsocket] = useState<WebSocket | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [isSendingInput, setIsSendingInput] = useState(false)
  const [calibrationSteps, setCalibrationSteps] = useState<CalibrationStep[]>([])
  const [isCancelled, setIsCancelled] = useState(false)
  const monitoringIntervalRef = useRef<number | null>(null)
  
  // Get robot type and ID from store based on selected arm
  const currentPort = selectedArm === 'leader' ? armConfig.leaderPort : armConfig.followerPort
  const robotType = selectedArm === 'leader' ? armConfig.leaderRobotType : armConfig.followerRobotType
  const robotId = selectedArm === 'leader' ? armConfig.leaderRobotId : armConfig.followerRobotId
  
  // Extract base robot type (remove _leader or _follower suffix)
  const baseRobotType = robotType.replace('_leader', '').replace('_follower', '')

  // LeRobot supported robots and their calibration steps
  const robotTypes: RobotType[] = [
    {
      id: 'so100',
      name: 'SO-100',
      description: '5-DOF robotic arm',
      calibrationSteps: [
        {
          id: 'connection',
          name: 'Connect to Robot',
          description: 'Establish connection to the robot arm',
          status: 'pending'
        },
        {
          id: 'step1',
          name: 'Step 1: Move to Middle Position',
          description: 'Move the test joint to the middle of its range',
          status: 'pending'
        },
        {
          id: 'step2',
          name: 'Step 2: Move All Joints',
          description: 'Move all joints through their entire range of motion',
          status: 'pending'
        },
        {
          id: 'completion',
          name: 'Calibration Complete',
          description: 'Calibration files saved and robot disconnected',
          status: 'pending'
        }
      ]
    },
    {
      id: 'giraffe',
      name: 'Giraffe v1.1',
      description: '6-DOF robotic arm',
      calibrationSteps: [
        {
          id: 'connection',
          name: 'Connect to Robot',
          description: 'Establish connection to the robot arm',
          status: 'pending'
        },
        {
          id: 'step1',
          name: 'Step 1: Move to Middle Position',
          description: 'Move the test joint to the middle of its range',
          status: 'pending'
        },
        {
          id: 'step2',
          name: 'Step 2: Move All Joints',
          description: 'Move all joints through their entire range of motion',
          status: 'pending'
        },
        {
          id: 'completion',
          name: 'Calibration Complete',
          description: 'Calibration files saved and robot disconnected',
          status: 'pending'
        }
      ]
    }
  ]

  const selectedRobotType = robotTypes.find(robot => robot.id === baseRobotType)

  // Initialize calibration steps when robot type changes
  useEffect(() => {
    if (selectedRobotType) {
      setCalibrationSteps([...selectedRobotType.calibrationSteps])
    }
  }, [robotType])

  // Check backend connection on component mount
  useEffect(() => {
    checkBackendConnection()
    
    // Set up periodic connection check every 5 seconds
    const connectionInterval = setInterval(checkBackendConnection, 5000)
    
    // Cleanup interval on unmount
    return () => clearInterval(connectionInterval)
  }, [])

  // Debug: Log when backendConnected state changes
  useEffect(() => {
    console.log('Backend connected state changed to:', backendConnected)
  }, [backendConnected])

  // Debug: Log when calibration state changes
  useEffect(() => {
    console.log('Calibration state changed - isCalibrating:', isCalibrating, 'waitingForUser:', waitingForUser)
  }, [isCalibrating, waitingForUser])

  const checkBackendConnection = async () => {
    try {
      console.log('Checking backend connection...')
      const response = await fetch(`${BACKEND_URL}/health`)
      console.log('Backend response status:', response.status)
      if (response.ok) {
        console.log('Backend connection successful')
        setBackendConnected(true)
      } else {
        console.log('Backend connection failed with status:', response.status)
        setBackendConnected(false)
      }
    } catch (error) {
      console.error('Backend connection failed:', error)
      setBackendConnected(false)
    }
  }

  const startCalibration = async () => {
    if (!currentPort) {
      toast.error(`Please configure ${selectedArm} arm port in Arm Configuration`)
      return
    }

    if (!robotType) {
      toast.error(`Please configure ${selectedArm} arm robot type in Arm Configuration`)
      return
    }

    if (!robotId) {
      toast.error(`Please configure ${selectedArm} arm robot ID in Arm Configuration`)
      return
    }

    if (!selectedRobotType) {
      toast.error(`Robot type "${baseRobotType}" is not supported. Please configure a supported robot type in Arm Configuration`)
      return
    }

    if (backendConnected !== true) {
      toast.error('Backend is not connected. Please start the Python backend server.')
      return
    }

    setIsCalibrating(true)
    setCurrentStep(0)
    setCalibrationOutput('')
    setIsCancelled(false)

    // Reset all steps to pending
    setCalibrationSteps(selectedRobotType.calibrationSteps.map(step => ({ ...step, status: 'pending' as const })))

    try {
      // Start calibration via backend
      const response = await fetch(`${BACKEND_URL}/calibrate/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arm_type: selectedArm,
          robot_type: robotType,
          port: currentPort,
          robot_id: robotId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start calibration: ${response.statusText}`)
      }

      const result = await response.json()
      setSessionId(result.session_id)
      setCalibrationOutput(`Calibration started with session ID: ${result.session_id}\nCommand: python -m lerobot.calibrate --${selectedArm === 'leader' ? 'teleop' : 'robot'}.type=${robotType} --${selectedArm === 'leader' ? 'teleop' : 'robot'}.port=${currentPort} --${selectedArm === 'leader' ? 'teleop' : 'robot'}.id=${robotId}`)

      // Start WebSocket connection for real-time output
      startWebSocketConnection(result.session_id)

      // Start monitoring the calibration process
      // monitorCalibrationProcess(result.session_id)

    } catch (error) {
      console.error('Calibration start failed:', error)
      toast.error(`Failed to start calibration: ${error}`)
      setIsCalibrating(false)
    }
  }

  const startWebSocketConnection = (sessionId: string) => {
    console.log('Starting WebSocket connection for session:', sessionId)
    const wsUrl = `ws://localhost:8000/ws/calibration/${sessionId}`
    console.log('WebSocket URL:', wsUrl)
    
    const ws = new WebSocket(wsUrl)
    
    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      console.error('WebSocket connection timeout after 5 seconds')
      console.log('WebSocket ready state:', ws.readyState)
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }, 5000)
    
    ws.onopen = () => {
      console.log('WebSocket connected for calibration')
      clearTimeout(connectionTimeout) // Clear timeout when connection is successful
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('WebSocket message received:', data)
      
      if (data.type === 'output') {
        // Clean up the output for better display
        let cleanOutput = data.data
        // Remove excessive whitespace and normalize line endings
        cleanOutput = cleanOutput.replace(/\r/g, '').trim()
        
        console.log('Received calibration output:', cleanOutput)
        
        setCalibrationOutput(cleanOutput)
        
        // Check if output indicates waiting for user input - more precise detection
        const output_lower = cleanOutput.toLowerCase()
        
        // Only detect waiting on specific prompts, not on every output
        if (output_lower.includes('press enter....') || 
            output_lower.includes('press enter to stop') ||
            output_lower.includes('press enter to continue') ||
            output_lower.includes('press enter') ||
            (output_lower.includes('move test') && output_lower.includes('middle of its range')) ||
            (output_lower.includes('move all joints') && output_lower.includes('entire ranges'))) {
          console.log('Calibration waiting for user input:', cleanOutput)
          setWaitingForUser(true)
        } else {
          // Clear waiting state if we see completion messages
          if (cleanOutput.includes('Calibration completed successfully') || 
              cleanOutput.includes('Process finished') ||
              cleanOutput.includes('Calibration completed!') ||
              cleanOutput.includes('exit code 0') ||
              cleanOutput.includes('calibration files saved') ||
              cleanOutput.includes('Calibration saved to')) {
            setWaitingForUser(false)
          }
          console.log('No waiting detected in output:', cleanOutput)
        }
        
        // Update step status based on output content
        if (calibrationSteps.length > 0) {
          // Step 0: Connection - Look for connection establishment
          if (cleanOutput.includes('Connected to robot') || 
              cleanOutput.includes('Connection established') ||
              cleanOutput.includes('Robot connected') ||
              cleanOutput.includes('Starting calibration') ||
              cleanOutput.includes('Calibration started for')) {
            setCalibrationSteps(prev => prev.map((step, idx) => 
              idx === 0 ? { ...step, status: 'completed' as const } : 
              idx === 1 ? { ...step, status: 'in-progress' as const } : step
            ))
            setCurrentStep(1)
          }
          
          // Step 1: Move to Middle Position - Look for "Move test" message
          else if (cleanOutput.includes('Move test') && cleanOutput.includes('middle of its range')) {
            setCalibrationSteps(prev => prev.map((step, idx) => 
              idx === 0 ? { ...step, status: 'completed' as const } : 
              idx === 1 ? { ...step, status: 'in-progress' as const } : step
            ))
            setCurrentStep(1)
          }
          
          // Step 2: Move All Joints - Look for "Move all joints" message
          else if (cleanOutput.includes('Move all joints') && cleanOutput.includes('entire ranges')) {
            setCalibrationSteps(prev => prev.map((step, idx) => 
              idx === 1 ? { ...step, status: 'completed' as const } : 
              idx === 2 ? { ...step, status: 'in-progress' as const } : step
            ))
            setCurrentStep(2)
          }
          
          // Completion - Look for calibration data saved or completion messages
          else if (cleanOutput.includes('Calibration data collected') ||
                   cleanOutput.includes('Calibration data saved') ||
                   cleanOutput.includes('Calibration saved to') ||
                   cleanOutput.includes('Calibration completed successfully') || 
                   cleanOutput.includes('Process finished') ||
                   cleanOutput.includes('Calibration completed!') ||
                   cleanOutput.includes('exit code 0') ||
                   cleanOutput.includes('calibration files saved')) {
            // Check if this was a cancellation
            if (cleanOutput.includes('Calibration cancelled by user')) {
              // Don't mark steps as completed for cancellation
              setCalibrationSteps(prev => prev.map(step => ({ ...step, status: 'failed' as const })))
              setCurrentStep(0)
            } else {
              // Mark all steps as completed for successful completion
              setCalibrationSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })))
              setCurrentStep(calibrationSteps.length - 1)
            }
            // Reset waiting state when calibration completes
            setWaitingForUser(false)
          }
          
          // Handle errors
          else if (cleanOutput.includes('Error') || 
                   cleanOutput.includes('Failed') ||
                   cleanOutput.includes('Exception') ||
                   cleanOutput.includes('exit code 1')) {
            // Mark current step as failed
            setCalibrationSteps(prev => prev.map((step, idx) => 
              idx === currentStep ? { ...step, status: 'failed' as const } : step
            ))
          }
        }
      } else if (data.type === 'status') {
        console.log('WebSocket status message:', data.data, 'isCancelled:', isCancelled)
        if (data.data.status === 'finished') {
          console.log('Process finished, checking if cancelled...')
          console.log('Before state update - isCalibrating:', isCalibrating, 'waitingForUser:', waitingForUser)
          setIsCalibrating(false)
          setWaitingForUser(false)
          console.log('State update commands sent')
      
          // Check if this was a cancellation by looking at the output or cancellation flag
          if (isCancelled || calibrationOutput.includes('Calibration cancelled by user')) {
            console.log('Calibration was cancelled, not showing success toast')
            setCalibrationSteps(prev => prev.map(step => ({ ...step, status: 'failed' as const })))
            setCurrentStep(0)
            // Don't show success toast for cancellation
          } else {
            console.log('Calibration completed successfully, showing toast')
            setCalibrationSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })))
            setCurrentStep(calibrationSteps.length - 1)
            toast.success('Calibration completed successfully!')
          }
      
          // Check for calibration files
          checkCalibrationFiles()
        }
      } else if (data.type === 'error') {
        console.error('WebSocket error:', data.data)
        toast.error(`Calibration error: ${data.data}`)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      clearTimeout(connectionTimeout)
    }

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, 'Reason:', event.reason)
      clearTimeout(connectionTimeout)
    }

    setWebsocket(ws)
  }

  const monitorCalibrationProcess = async (sessionId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/calibrate/status/${sessionId}`)
        if (response.ok) {
          const status = await response.json()
          
          // Check if waiting for input
          const isWaiting = status.is_waiting_for_input || false
          setWaitingForUser(isWaiting)
          
          if (!status.is_running && isCalibrating) {
            console.log('Monitor detected process finished, cleaning up...')
            setIsCalibrating(false)
            setWaitingForUser(false)
            
            // Clear the monitoring interval
            if (monitoringIntervalRef.current) {
              clearInterval(monitoringIntervalRef.current)
              monitoringIntervalRef.current = null
            }
            
            // Only show success toast if not cancelled and WebSocket hasn't already handled it
            if (!isCancelled && !calibrationOutput.includes('Calibration cancelled by user')) {
              toast.success('Calibration completed!')
            }
            
            checkCalibrationFiles()
          }
        }
      } catch (error) {
        console.error('Status check failed:', error)
      }
    }

    // Check status every 2 seconds
    const interval = setInterval(checkStatus, 2000)
    monitoringIntervalRef.current = interval
    
    // Clean up interval when component unmounts or calibration stops
    return () => {
      console.log('Clearing monitoring interval for session:', sessionId)
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
        monitoringIntervalRef.current = null
      }
    }
  }

  const handleContinue = async () => {
    if (!sessionId || isSendingInput) {
      return // Prevent multiple clicks
    }

    setIsSendingInput(true)
    
    try {
      const response = await fetch(`${BACKEND_URL}/calibrate/input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          input_data: '\n'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to send input: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        setWaitingForUser(false)
        setCalibrationOutput('[INFO] Enter key sent to calibration process')
        
        // Mark current step as completed when user clicks Continue
        setCalibrationSteps(prev => prev.map((step, idx) => {
          if (idx === currentStep) {
            return { ...step, status: 'completed' as const }
          } else if (idx === currentStep + 1) {
            return { ...step, status: 'in-progress' as const }
          }
          return step
        }))
        
        // Advance to next step if available
        if (currentStep + 1 < calibrationSteps.length) {
          setCurrentStep(currentStep + 1)
        }
        
        // Add a small delay to prevent rapid clicking
        await new Promise(resolve => setTimeout(resolve, 500))
      } else {
        toast.error('Failed to send input to calibration process')
      }
    } catch (error) {
      console.error('Send input failed:', error)
      toast.error(`Failed to send input: ${error}`)
    } finally {
      setIsSendingInput(false)
    }
  }

  const handleCancel = async () => {
    if (!sessionId) {
      console.log('No session ID available for cancellation')
      return
    }

    console.log('Cancelling calibration for session:', sessionId)

    // Set cancellation flag and close WebSocket immediately to prevent status messages
    setIsCancelled(true)
    if (websocket) {
      websocket.close()
      setWebsocket(null)
    }

    try {
      // Stop the calibration process via backend
      const response = await fetch(`${BACKEND_URL}/calibrate/stop/${sessionId}`, {
        method: 'DELETE'
      })

      console.log('Cancel response status:', response.status)
      console.log('Cancel response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Cancel response result:', result)
        if (result.success) {
          toast.success('Calibration cancelled successfully')
        } else {
          toast.error('Failed to cancel calibration')
        }
      } else {
        const errorText = await response.text()
        console.error('Cancel failed with status:', response.status, 'Error:', errorText)
        toast.error('Failed to cancel calibration')
      }
    } catch (error) {
      console.error('Cancel calibration failed:', error)
      toast.error(`Failed to cancel calibration: ${error}`)
    } finally {
      // Clean up state regardless of API response
      setIsCalibrating(false)
      setWaitingForUser(false)
      setCalibrationSteps(prev => prev.map(step => ({ ...step, status: 'failed' as const })))
      setCurrentStep(0)
      setCalibrationOutput('[INFO] Calibration cancelled by user')
      
      // Clear monitoring interval
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
        monitoringIntervalRef.current = null
      }
    }
  }

  const checkCalibrationFiles = async (retryCount = 0) => {
    try {
      const response = await fetch(`${BACKEND_URL}/check-calibration-files/${robotId}?arm_type=${selectedArm}`)
      if (response.ok) {
        const result = await response.json()
        console.log('Calibration files check result:', result)
        if (result.file_count > 0) {
          const fileList = result.files.map((file: any) => `  - ${file.name} (${file.path})`).join('\n')
          setCalibrationOutput(`[SUCCESS] Calibration files saved:\n${fileList}`)
        } else {
          if (retryCount < 3) {
            // Retry after a delay if no files found
            console.log(`No files found, retrying in 2 seconds... (attempt ${retryCount + 1}/3)`)
            setTimeout(() => checkCalibrationFiles(retryCount + 1), 2000)
            setCalibrationOutput(`[INFO] Checking for calibration files... (attempt ${retryCount + 1}/3)`)
          } else {
            setCalibrationOutput(`[WARNING] No calibration files found in cache directory: ${result.cache_directory}`)
          }
        }
      } else {
        console.error('Failed to check calibration files:', response.status, response.statusText)
        setCalibrationOutput(`[ERROR] Failed to check calibration files: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to check calibration files:', error)
      setCalibrationOutput(`[ERROR] Failed to check calibration files: ${error}`)
    }
  }

  const getStepIcon = (step: CalibrationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'in-progress':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepStatus = (step: CalibrationStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStepStatusText = (step: CalibrationStep) => {
    switch (step.status) {
      case 'completed':
        return 'Done'
      case 'failed':
        return 'Failed'
      case 'in-progress':
        return 'In Progress'
      default:
        return 'Pending'
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">Arm Calibration</h1>
        <p className="mt-2 text-gray-600">
          Calibrate your leader and follower robot arms for accurate control
        </p>
      </div>

      {/* Backend Connection Status */}
      <div className="mb-8">
        <div className={`card ${backendConnected === true ? 'border-green-200 bg-green-50' : backendConnected === false ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {backendConnected === true ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : backendConnected === false ? (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              ) : (
                <ArrowPathIcon className="h-6 w-6 text-gray-500 animate-spin" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${backendConnected === true ? 'text-green-800' : backendConnected === false ? 'text-red-800' : 'text-gray-800'} font-heading`}>
                  Backend Connection
                </h3>
                <p className={backendConnected === true ? 'text-green-700' : backendConnected === false ? 'text-red-700' : 'text-gray-700'}>
                  {backendConnected === true 
                    ? 'Python backend is connected and ready'
                    : backendConnected === false
                    ? 'Python backend is not connected. Please start the backend server.'
                    : 'Checking backend connection...'
                  }
                </p>
                {backendConnected === false && (
                  <p className="text-sm text-red-600 mt-2">
                    Run: <code className="bg-red-100 px-1 rounded">cd backend && python main.py</code>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={checkBackendConnection}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 font-heading">Calibration Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Arm Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Arm
              </label>
              <select
                value={selectedArm}
                onChange={(e) => setSelectedArm(e.target.value as 'leader' | 'follower')}
                className="input-field"
                disabled={isCalibrating}
              >
                <option value="leader">Leader Arm</option>
                <option value="follower">Follower Arm</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Port: {currentPort || 'Not configured'}
              </p>
            </div>

            {/* Robot Type Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Robot Type
              </label>
              <div className="input-field bg-gray-50 text-gray-700">
                {robotType}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                From Arm Configuration
              </p>
            </div>

            {/* Robot ID Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Robot ID
              </label>
              <div className="input-field bg-gray-50 text-gray-700">
                {robotId}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                From Arm Configuration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Port Configuration Check */}
      {!currentPort && (
        <div className="mb-8">
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 font-heading">Port Not Configured</h3>
                <p className="text-red-700">
                  Please configure the {selectedArm} arm port in the Arm Configuration page before starting calibration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* Calibration Steps */}
        <div>
          {/* Steps List */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 font-heading">Calibration Steps</h2>
              {isCalibrating && (
                <div className="text-sm text-blue-600 font-medium">
                  Step {currentStep + 1} of {calibrationSteps.length || 0}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {calibrationSteps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    index === currentStep && step.status === 'in-progress'
                      ? 'border-yellow-300 bg-yellow-50 shadow-md'
                      : index === currentStep && step.status === 'waiting-user'
                      ? 'border-yellow-300 bg-yellow-50 shadow-md'
                      : step.status === 'completed'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStepIcon(step)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          step.status === 'completed' 
                            ? 'text-green-900' 
                            : index === currentStep && step.status === 'in-progress'
                            ? 'text-yellow-900'
                            : 'text-gray-900'
                        }`}>
                          {step.name}
                          {index === currentStep && step.status === 'in-progress' && (
                            <span className="ml-2 text-yellow-600 text-sm font-normal">(Current)</span>
                          )}
                          {index === currentStep && step.status === 'waiting-user' && (
                            <span className="ml-2 text-yellow-600 text-sm font-normal">(Waiting for input)</span>
                          )}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStepStatus(step)}`}>
                          {getStepStatusText(step)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      
                      {/* Show user prompt if waiting */}
                      {step.status === 'waiting-user' && step.userPrompt && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
                          <strong>User Action Required:</strong> {step.userPrompt}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={startCalibration}
              disabled={isCalibrating || !currentPort || !robotType || !robotId || backendConnected === false}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalibrating ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Calibrating...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Calibration
                </>
              )}
            </button>

            {/* Continue Button - only show when waiting for user input AND calibration is running */}
            {waitingForUser && isCalibrating && (
              <button
                onClick={handleContinue}
                disabled={isSendingInput}
                className="btn-primary bg-yellow-600 hover:bg-yellow-700 border-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingInput ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Continue
                  </>
                )}
              </button>
            )}

            {/* Cancel Button - only show when calibration is running */}
            {isCalibrating && (
              <button
                onClick={handleCancel}
                disabled={isSendingInput}
                className="btn-secondary bg-red-600 hover:bg-red-700 border-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel Calibration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 