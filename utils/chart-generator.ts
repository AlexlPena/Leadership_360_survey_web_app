import type { AggregatedSubmission } from "../types/survey"
import { calculateScore } from "../lib/score-utils"
import { EMPLOYEE_SECTIONS, SUPERVISOR_SECTIONS, DIRECTOR_SECTIONS, MANAGER_SECTIONS } from "../lib/survey-data"

// Helper function to get the actual question text from the survey data
const getThirdPersonQuestionText = (sectionId: string, questionId: string): string => {
  const findInSections = (sections: any[]) => {
    const section = sections.find((s) => s.id === sectionId)
    if (section) {
      const question = section.questions.find((q: any) => q.id === questionId)
      if (question) return question.text
    }
    return null
  }

  return (
    findInSections(EMPLOYEE_SECTIONS) ||
    findInSections(DIRECTOR_SECTIONS) ||
    findInSections(MANAGER_SECTIONS) ||
    findInSections(SUPERVISOR_SECTIONS) ||
    questionId
  )
}

interface QuestionComparison {
  questionText: string
  selfScore: number
  othersScore: number
  sectionTitle: string
}

export function generateComparisonChartBase64(submission: AggregatedSubmission): Promise<string> {
  return new Promise((resolve) => {
    // Extract comparison data
    const allQuestions = new Map<string, QuestionComparison>()

    // Add questions from self assessment
    if (submission.selfSections) {
      submission.selfSections.forEach((section) => {
        section.questions.forEach((question) => {
          const questionKey = `${section.id}-${question.questionId}`
          const score = calculateScore(question.responses)
          const actualQuestionText = getThirdPersonQuestionText(section.id, question.questionId)

          allQuestions.set(questionKey, {
            questionText: actualQuestionText || question.questionText,
            selfScore: score,
            othersScore: 0,
            sectionTitle: section.title,
          })
        })
      })
    }

    // Process each section to get the combined others score
    const allSectionIds = new Set<string>()
    submission.peerSections?.forEach((s) => allSectionIds.add(s.id))
    submission.directSections?.forEach((s) => allSectionIds.add(s.id))
    submission.managerSections?.forEach((s) => allSectionIds.add(s.id))

    allSectionIds.forEach((sectionId) => {
      const peerSection = submission.peerSections?.find((s) => s.id === sectionId)
      const directSection = submission.directSections?.find((s) => s.id === sectionId)
      const managerSection = submission.managerSections?.find((s) => s.id === sectionId)

      const questionIds = new Set<string>()
      peerSection?.questions.forEach((q) => questionIds.add(q.questionId))
      directSection?.questions.forEach((q) => questionIds.add(q.questionId))
      managerSection?.questions.forEach((q) => questionIds.add(q.questionId))

      questionIds.forEach((questionId) => {
        const questionKey = `${sectionId}-${questionId}`

        const scores = []
        if (peerSection) {
          const peerQ = peerSection.questions.find((q) => q.questionId === questionId)
          if (peerQ)
            scores.push({
              score: calculateScore(peerQ.responses),
              weight: submission.surveyTypeCounts?.peer || 0,
            })
        }
        if (directSection) {
          const directQ = directSection.questions.find((q) => q.questionId === questionId)
          if (directQ)
            scores.push({
              score: calculateScore(directQ.responses),
              weight: submission.surveyTypeCounts?.direct || 0,
            })
        }
        if (managerSection) {
          const managerQ = managerSection.questions.find((q) => q.questionId === questionId)
          if (managerQ)
            scores.push({
              score: calculateScore(managerQ.responses),
              weight: submission.surveyTypeCounts?.manager || 0,
            })
        }

        const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
        const weightedScore = totalWeight > 0 ? scores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight : 0

        if (!allQuestions.has(questionKey)) {
          const questionText = getThirdPersonQuestionText(sectionId, questionId)
          const sectionTitle = peerSection?.title || directSection?.title || managerSection?.title || "Unknown Section"

          allQuestions.set(questionKey, {
            questionText: questionText,
            selfScore: 0,
            othersScore: Math.round(weightedScore * 10) / 10,
            sectionTitle: sectionTitle,
          })
        } else {
          const existing = allQuestions.get(questionKey)!
          existing.othersScore = Math.round(weightedScore * 10) / 10
        }
      })
    })

    // Group by section
    const questionsBySection = new Map<string, QuestionComparison[]>()
    Array.from(allQuestions.values()).forEach((question) => {
      if (!questionsBySection.has(question.sectionTitle)) {
        questionsBySection.set(question.sectionTitle, [])
      }
      questionsBySection.get(question.sectionTitle)!.push(question)
    })

    // Create canvas
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    // Calculate dimensions
    const totalQuestions = Array.from(allQuestions.values()).length
    const sectionsCount = questionsBySection.size

    // Scale factor for the entire chart (2.5x larger)
    const scaleFactor = 2.5

    // Canvas dimensions
    const width = 1200 * scaleFactor
    const headerHeight = 120 * scaleFactor
    const questionHeight = 80 * scaleFactor
    const sectionHeaderHeight = 60 * scaleFactor
    const padding = 40 * scaleFactor
    const height = headerHeight + sectionsCount * sectionHeaderHeight + totalQuestions * questionHeight + padding * 2

    canvas.width = width
    canvas.height = height

    // Set background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    let currentY = padding

    // Draw header
    ctx.fillStyle = "#1f2937"
    ctx.font = `bold ${Math.round(24 * scaleFactor)}px Arial`
    ctx.textAlign = "center"
    ctx.fillText("Question-by-Question Comparison", width / 2, currentY + 30 * scaleFactor)

    ctx.font = `${Math.round(16 * scaleFactor)}px Arial`
    ctx.fillStyle = "#6b7280"
    ctx.fillText(
      `Compare how ${submission.managerName} rates themselves vs. how others rate them on each question`,
      width / 2,
      currentY + 60 * scaleFactor,
    )

    currentY += headerHeight

    // Draw sections and questions
    Array.from(questionsBySection.entries()).forEach(([sectionTitle, questions]) => {
      // Draw section header
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(padding, currentY, width - padding * 2, sectionHeaderHeight)

      ctx.fillStyle = "#1f2937"
      ctx.font = `bold ${Math.round(18 * scaleFactor)}px Arial`
      ctx.textAlign = "left"
      ctx.fillText(sectionTitle, padding + 20 * scaleFactor, currentY + 35 * scaleFactor)

      currentY += sectionHeaderHeight

      // Draw questions
      questions.forEach((question, index) => {
        const questionY = currentY
        const barY = questionY + 35 * scaleFactor
        const barHeight = 20 * scaleFactor
        const barWidth = 300 * scaleFactor
        const othersBarX = padding + 20 * scaleFactor
        const selfBarX = padding + 20 * scaleFactor + barWidth + 40 * scaleFactor
        const scoresX = padding + 20 * scaleFactor + barWidth * 2 + 100 * scaleFactor

        // Draw question text (truncated if too long)
        ctx.fillStyle = "#374151"
        ctx.font = `${Math.round(14 * scaleFactor)}px Arial`
        ctx.textAlign = "left"
        const maxQuestionWidth = width - scoresX - 100 * scaleFactor
        let questionText = question.questionText
        if (ctx.measureText(questionText).width > maxQuestionWidth) {
          while (ctx.measureText(questionText + "...").width > maxQuestionWidth && questionText.length > 0) {
            questionText = questionText.slice(0, -1)
          }
          questionText += "..."
        }
        ctx.fillText(questionText, padding + 20 * scaleFactor, questionY + 20 * scaleFactor)

        // Draw "Others' Assessment" label and bar
        ctx.fillStyle = "#6b7280"
        ctx.font = `${Math.round(12 * scaleFactor)}px Arial`
        ctx.fillText("Others' Assessment", othersBarX, barY - 5 * scaleFactor)

        // Others bar background
        ctx.fillStyle = "#e5e7eb"
        ctx.fillRect(othersBarX, barY, barWidth, barHeight)

        // Others bar fill
        const othersWidth = (question.othersScore / 5) * barWidth
        ctx.fillStyle = "#3b82f6"
        ctx.fillRect(othersBarX, barY, othersWidth, barHeight)

        // Others score text
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${Math.round(12 * scaleFactor)}px Arial`
        ctx.textAlign = "center"
        if (othersWidth > 30 * scaleFactor) {
          ctx.fillText(
            question.othersScore.toFixed(1),
            othersBarX + othersWidth - 15 * scaleFactor,
            barY + 14 * scaleFactor,
          )
        }

        // Draw "Self Assessment" label and bar
        ctx.fillStyle = "#6b7280"
        ctx.font = `${Math.round(12 * scaleFactor)}px Arial`
        ctx.textAlign = "left"
        ctx.fillText("Self Assessment", selfBarX, barY - 5 * scaleFactor)

        // Self bar background
        ctx.fillStyle = "#e5e7eb"
        ctx.fillRect(selfBarX, barY, barWidth, barHeight)

        // Self bar fill
        const selfWidth = (question.selfScore / 5) * barWidth
        ctx.fillStyle = "#6b7280"
        ctx.fillRect(selfBarX, barY, selfWidth, barHeight)

        // Self score text
        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${Math.round(12 * scaleFactor)}px Arial`
        ctx.textAlign = "center"
        if (selfWidth > 30 * scaleFactor) {
          ctx.fillText(question.selfScore.toFixed(1), selfBarX + selfWidth - 15 * scaleFactor, barY + 14 * scaleFactor)
        }

        // Draw scores
        ctx.fillStyle = "#1f2937"
        ctx.font = `bold ${Math.round(14 * scaleFactor)}px Arial`
        ctx.textAlign = "left"
        ctx.fillText(`Others: ${question.othersScore.toFixed(1)}`, scoresX, questionY + 15 * scaleFactor)
        ctx.fillText(`Self: ${question.selfScore.toFixed(1)}`, scoresX, questionY + 35 * scaleFactor)

        // Draw difference indicator
        const difference = Math.abs(question.othersScore - question.selfScore)
        if (difference > 0.5) {
          ctx.font = `${Math.round(12 * scaleFactor)}px Arial`
          if (question.othersScore > question.selfScore) {
            ctx.fillStyle = "#059669"
            ctx.fillText(`+${difference.toFixed(1)} Others Higher`, scoresX, questionY + 55 * scaleFactor)
          } else {
            ctx.fillStyle = "#dc2626"
            ctx.fillText(`+${difference.toFixed(1)} Self Higher`, scoresX, questionY + 55 * scaleFactor)
          }
        }

        currentY += questionHeight
      })
    })

    // Add scale legend at the bottom
    currentY += 20 * scaleFactor
    ctx.fillStyle = "#6b7280"
    ctx.font = `${Math.round(12 * scaleFactor)}px Arial`
    ctx.textAlign = "center"
    ctx.fillText("Scale: 1 (Never) - 2 (Rarely) - 3 (Sometimes) - 4 (Often) - 5 (Always)", width / 2, currentY)

    // Convert to base64
    const base64String = canvas.toDataURL("image/png").split(",")[1]
    resolve(base64String)
  })
}
