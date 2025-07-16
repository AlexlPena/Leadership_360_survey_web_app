import { dataStore } from "@/lib/data-store"
import { EMPLOYEE_SECTIONS, SUPERVISOR_SECTIONS, DIRECTOR_SECTIONS, MANAGER_SECTIONS } from "@/lib/survey-data"

// Function to generate a random Likert response (1-5 as strings)
const getRandomLikertResponse = (): string => {
  return (Math.floor(Math.random() * 5) + 1).toString()
}

// Function to generate responses for a section with proper structure
const generateSectionResponses = (sections: any[]) => {
  const responses: Record<string, Record<string, string>> = {}

  sections.forEach((section) => {
    responses[section.id] = {}
    section.questions.forEach((question: any) => {
      responses[section.id][question.id] = getRandomLikertResponse()
    })
  })

  console.log("🎲 Generated responses structure:", responses)
  return responses
}

// Generate random comments with proper perspective for each survey type
const generateRandomComments = (surveyType: string) => {
  const commentsByType = {
    supervisor: [
      "I believe I've made significant progress in my leadership skills this year.",
      "I need to work on providing more regular feedback to my team.",
      "My communication with stakeholders has improved substantially.",
      "I want to focus more on developing others in the coming year.",
      "I feel confident in my ability to drive results and accountability.",
    ],
    employee: [
      "John is an excellent leader who always makes time for his team.",
      "I appreciate how John listens to feedback and implements changes.",
      "John could improve on providing more regular feedback.",
      "Great communication skills, but sometimes meetings run too long.",
      "Very supportive of career development and growth opportunities.",
      "John demonstrates strong leadership and drives team success effectively.",
    ],
    director: [
      "John has been a great leader for me. He provides clear direction.",
      "I appreciate the regular one-on-ones and career development discussions.",
      "John is always available when I need guidance or support.",
      "His feedback has been instrumental in my professional growth.",
      "John balances being supportive with holding people accountable.",
      "He creates a positive work environment and encourages innovation.",
    ],
    manager: [
      "John demonstrates strong leadership skills and drives team success.",
      "His communication style is effective and he consistently achieves results.",
      "John has been instrumental in improving our team's performance.",
      "He balances being supportive with holding people accountable.",
      "John shows excellent strategic thinking and decision-making abilities.",
      "His leadership approach aligns well with our organizational goals.",
    ],
  }

  const comments = commentsByType[surveyType as keyof typeof commentsByType] || []
  const numComments = Math.floor(Math.random() * 2) + 1 // 1-2 comments
  const selectedComments = []

  for (let i = 0; i < numComments && i < comments.length; i++) {
    const randomIndex = Math.floor(Math.random() * comments.length)
    selectedComments.push(comments[randomIndex])
    comments.splice(randomIndex, 1) // Remove to avoid duplicates
  }

  return selectedComments.join("\n\n")
}

// Generate test data for all survey types
export const generateTestData = async () => {
  try {
    console.log("🎲 Starting test data generation...")

    // Generate Self Assessment (supervisor type)
    const selfAssessmentData = {
      type: "supervisor" as const,
      surveyId: `SELF-${Math.random().toString(36).substr(2, 9)}`,
      employeeName: "John Doe",
      supervisorName: "John Doe", // Self assessment
      managerName: "John Doe",
      managerId: "Recipient_JD001",
      submittedAt: new Date(),
      status: "completed" as const,
      responses: generateSectionResponses(SUPERVISOR_SECTIONS),
      comments: generateRandomComments("supervisor"),
      ipAddress: "127.0.0.1",
      userAgent: "Test Generator - Self Assessment",
    }

    console.log("🎲 Generated Self Assessment:", selfAssessmentData)
    await dataStore.addSubmission(selfAssessmentData)

    // Generate Peer & Colleague Assessment (employee type)
    const peerAssessmentData = {
      type: "employee" as const,
      surveyId: `PEER-${Math.random().toString(36).substr(2, 9)}`,
      employeeName: "Sarah Johnson", // Peer reviewer
      managerName: "John Doe", // Manager being assessed
      managerId: "Recipient_JD001",
      submittedAt: new Date(),
      status: "completed" as const,
      responses: generateSectionResponses(EMPLOYEE_SECTIONS),
      comments: generateRandomComments("employee"),
      ipAddress: "127.0.0.2",
      userAgent: "Test Generator - Peer & Colleague Assessment",
    }

    console.log("🎲 Generated Peer & Colleague Assessment:", peerAssessmentData)
    await dataStore.addSubmission(peerAssessmentData)

    // Generate Direct Report Assessment (director type)
    const directAssessmentData = {
      type: "director" as const,
      surveyId: `DIRECT-${Math.random().toString(36).substr(2, 9)}`,
      directorName: "Mike Wilson", // Direct report
      managerName: "John Doe", // Manager being assessed
      managerId: "Recipient_JD001",
      submittedAt: new Date(),
      status: "completed" as const,
      responses: generateSectionResponses(DIRECTOR_SECTIONS),
      comments: generateRandomComments("director"),
      ipAddress: "127.0.0.3",
      userAgent: "Test Generator - Direct Report Assessment",
    }

    console.log("🎲 Generated Direct Report Assessment:", directAssessmentData)
    await dataStore.addSubmission(directAssessmentData)

    // Generate Manager Assessment (manager type)
    const managerAssessmentData = {
      type: "manager" as const,
      surveyId: `MANAGER-${Math.random().toString(36).substr(2, 9)}`,
      managerName: "John Doe", // Manager being assessed
      managerId: "Recipient_JD001",
      submittedAt: new Date(),
      status: "completed" as const,
      responses: generateSectionResponses(MANAGER_SECTIONS),
      comments: generateRandomComments("manager"),
      ipAddress: "127.0.0.4",
      userAgent: "Test Generator - Manager Assessment",
    }

    console.log("🎲 Generated Manager Assessment:", managerAssessmentData)
    await dataStore.addSubmission(managerAssessmentData)

    console.log("✅ All test data generated successfully!")
    return { success: true, message: "Test data generated successfully for all 4 survey types!" }
  } catch (error) {
    console.error("❌ Error generating test data:", error)
    return { success: false, message: "Failed to generate test data." }
  }
}
