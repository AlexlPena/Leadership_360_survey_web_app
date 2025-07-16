/**
 * Calculates a weighted average score for survey responses
 *
 * @param responses Object containing counts for each response option
 * @returns Weighted average score rounded to one decimal place
 */
export function calculateScore(responses: {
  never: number
  rarely: number
  sometimes: number
  often: number
  always: number
}): number {
  // Define weights for each response option
  const weights = {
    never: 1,
    rarely: 2,
    sometimes: 3,
    often: 4,
    always: 5,
  }

  // Calculate the sum of weighted responses
  const weightedSum =
    responses.never * weights.never +
    responses.rarely * weights.rarely +
    responses.sometimes * weights.sometimes +
    responses.often * weights.often +
    responses.always * weights.always

  // Calculate the total number of responses
  const totalResponses = responses.never + responses.rarely + responses.sometimes + responses.often + responses.always

  // If there are no responses, return 0
  if (totalResponses === 0) {
    return 0
  }

  // Calculate the weighted average and round to one decimal place
  return Math.round((weightedSum / totalResponses) * 10) / 10
}

/**
 * Calculates section scores from survey responses
 *
 * @param responses Survey responses object
 * @param sections Array of survey sections
 * @returns Object with section scores
 */
export function calculateSectionScores(
  responses: Record<string, Record<string, string>>,
  sections: Array<{ id: string; title: string; questions: Array<{ id: string }> }>,
): Record<string, number> {
  const sectionScores: Record<string, number> = {}

  sections.forEach((section) => {
    const sectionResponses = responses[section.id] || {}
    const questionScores: number[] = []

    section.questions.forEach((question) => {
      const response = sectionResponses[question.id]
      if (response) {
        const score = getResponseScore(response)
        if (score > 0) {
          questionScores.push(score)
        }
      }
    })

    // Calculate average score for this section
    if (questionScores.length > 0) {
      const averageScore = questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length
      sectionScores[section.id] = Math.round(averageScore * 10) / 10
    } else {
      sectionScores[section.id] = 0
    }
  })

  return sectionScores
}

/**
 * Calculates overall score from section scores
 *
 * @param sectionScores Object containing section scores
 * @returns Overall average score
 */
export function calculateOverallScore(sectionScores: Record<string, number>): number {
  const scores = Object.values(sectionScores).filter((score) => score > 0)

  if (scores.length === 0) {
    return 0
  }

  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  return Math.round((totalScore / scores.length) * 10) / 10
}

/**
 * Converts response string to numeric score
 *
 * @param response Response string (never, rarely, sometimes, often, always)
 * @returns Numeric score (1-5)
 */
export function getResponseScore(response: string): number {
  const scoreMap: Record<string, number> = {
    never: 1,
    rarely: 2,
    sometimes: 3,
    often: 4,
    always: 5,
  }

  return scoreMap[response.toLowerCase()] || 0
}

/**
 * Gets a color based on the score value
 *
 * @param score Weighted average score
 * @returns CSS color class
 */
export function getScoreColor(score: number): string {
  if (score >= 4.5) return "bg-green-500"
  if (score >= 3.5) return "bg-green-400"
  if (score >= 2.5) return "bg-yellow-400"
  if (score >= 1.5) return "bg-orange-400"
  return "bg-red-500"
}

/**
 * Gets a text description based on the score value
 *
 * @param score Weighted average score
 * @returns Text description
 */
export function getScoreDescription(score: number): string {
  if (score >= 4.5) return "Excellent"
  if (score >= 3.5) return "Good"
  if (score >= 2.5) return "Average"
  if (score >= 1.5) return "Needs Improvement"
  return "Poor"
}

/**
 * Gets text color class based on score
 *
 * @param score Numeric score
 * @returns CSS text color class
 */
export function getScoreTextColor(score: number): string {
  if (score >= 4.5) return "text-green-600"
  if (score >= 3.5) return "text-blue-600"
  if (score >= 2.5) return "text-yellow-600"
  if (score >= 1.5) return "text-orange-600"
  return "text-red-600"
}
