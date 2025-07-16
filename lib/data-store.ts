import type { SurveyResponse, AggregatedSubmission, GroupedSubmissions, SurveyStats } from "../types/survey"

class DataStore {
  private storageKey = "leadership-survey-submissions"

  async addSubmission(submission: Partial<SurveyResponse>): Promise<void> {
    if (typeof window === "undefined") return

    try {
      const existing = this.getSubmissions()
      const newSubmission = {
        ...submission,
        id: Math.random().toString(36).substr(2, 9),
        lastModified: new Date(),
      }

      existing.push(newSubmission as SurveyResponse)
      localStorage.setItem(this.storageKey, JSON.stringify(existing))
      console.log("✅ Submission saved to localStorage:", newSubmission)
    } catch (error) {
      console.error("❌ Error saving submission:", error)
      throw error
    }
  }

  getSubmissions(): SurveyResponse[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.storageKey)
      const submissions = stored ? JSON.parse(stored) : []

      // Convert date strings to Date objects
      const processedSubmissions = submissions.map((sub: any) => ({
        ...sub,
        submittedAt: new Date(sub.submittedAt),
        lastModified: sub.lastModified ? new Date(sub.lastModified) : undefined,
      }))

      console.log("📊 Retrieved submissions from localStorage:", processedSubmissions.length, "total")
      console.log("📊 Submissions by type:", {
        employee: processedSubmissions.filter((s: any) => s.type === "employee").length,
        supervisor: processedSubmissions.filter((s: any) => s.type === "supervisor").length,
        director: processedSubmissions.filter((s: any) => s.type === "director").length,
        manager: processedSubmissions.filter((s: any) => s.type === "manager").length,
      })

      return processedSubmissions
    } catch (error) {
      console.error("❌ Error loading submissions:", error)
      return []
    }
  }

  async getGroupedSubmissions(): Promise<GroupedSubmissions> {
    const allSubmissions = this.getSubmissions()
    console.log("🔍 getGroupedSubmissions - Processing", allSubmissions.length, "total submissions")

    // Group submissions by manager and survey type
    const submissionsByManagerAndType = allSubmissions.reduce(
      (acc, sub) => {
        const managerName = sub.managerName || "Unknown"
        console.log("🔍 Processing submission:", {
          type: sub.type,
          managerName,
          employeeName: sub.employeeName,
          supervisorName: sub.supervisorName,
          directorName: sub.directorName,
          responsesKeys: Object.keys(sub.responses || {}),
          comments: sub.comments ? sub.comments.substring(0, 50) + "..." : "No comments",
        })

        if (!acc[managerName]) {
          acc[managerName] = {
            employee: [],
            supervisor: [],
            director: [],
            manager: [],
          }
        }

        if (sub.type === "employee") acc[managerName].employee.push(sub)
        if (sub.type === "supervisor") acc[managerName].supervisor.push(sub)
        if (sub.type === "director") acc[managerName].director.push(sub)
        if (sub.type === "manager") acc[managerName].manager.push(sub)

        return acc
      },
      {} as Record<
        string,
        {
          employee: SurveyResponse[]
          supervisor: SurveyResponse[]
          director: SurveyResponse[]
          manager: SurveyResponse[]
        }
      >,
    )

    console.log("🔍 Grouped submissions by manager:", submissionsByManagerAndType)

    // Create aggregated submissions with data from all survey types
    const aggregatedEmployeeSubmissions = Object.entries(submissionsByManagerAndType)
      .map(([managerName, submissions]) => {
        console.log("🔍 Creating aggregated submission for manager:", managerName)
        console.log("🔍 Submission counts:", {
          employee: submissions.employee.length,
          supervisor: submissions.supervisor.length,
          director: submissions.director.length,
          manager: submissions.manager.length,
        })

        // Only create aggregated submission if there are any submissions for this manager
        const totalSubmissions =
          submissions.employee.length +
          submissions.supervisor.length +
          submissions.director.length +
          submissions.manager.length

        if (totalSubmissions === 0) {
          console.log("🔍 No submissions found for manager:", managerName)
          return null
        }

        // Get the latest submission date across all types
        const allSubs = [
          ...submissions.employee,
          ...submissions.supervisor,
          ...submissions.director,
          ...submissions.manager,
        ]
        const latestSubmission = new Date(Math.max(...allSubs.map((s) => s.submittedAt.getTime())))

        // Aggregate sections for each survey type
        const peerSections = this.aggregateResponses(submissions.employee, "peer")
        const directSections = this.aggregateResponses(submissions.director, "direct")
        const managerSections = this.aggregateResponses(submissions.manager, "manager")
        const selfSections = this.aggregateResponses(submissions.supervisor, "self")

        console.log("🔍 Aggregated sections:", {
          peer: peerSections.length,
          direct: directSections.length,
          manager: managerSections.length,
          self: selfSections.length,
        })

        // FIXED: Collect comments from correct survey types
        // supervisor type = self assessment (first person comments)
        // employee type = peer assessment (third person comments about manager)
        // director type = direct assessment (third person comments from direct reports)
        // manager type = manager assessment (third person comments from manager's supervisor)

        const selfComments = submissions.supervisor.map((s) => s.comments).filter(Boolean) as string[]
        const peerComments = submissions.employee.map((s) => s.comments).filter(Boolean) as string[]
        const directComments = submissions.director.map((s) => s.comments).filter(Boolean) as string[]
        const managerComments = submissions.manager.map((s) => s.comments).filter(Boolean) as string[]

        console.log("🔍 DEBUGGING COMMENTS MAPPING:")
        console.log("🔍 Self Comments (from supervisor type):", selfComments)
        console.log("🔍 Peer Comments (from employee type):", peerComments)
        console.log("🔍 Direct Comments (from director type):", directComments)
        console.log("🔍 Manager Comments (from manager type):", managerComments)

        const aggregatedSubmission = {
          id: `agg-${Math.random().toString(36).substr(2, 9)}`,
          managerName,
          managerId: allSubs[0]?.managerId || `Recipient_${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          employeeCount: submissions.employee.length,
          submittedAt: latestSubmission,
          status: "completed",

          // Main sections (keeping for backward compatibility - using self assessment data)
          sections: selfSections,

          // Separate aggregated data for each survey type
          peerSections,
          directSections,
          managerSections,
          selfSections,

          // Collect comments from all survey types (legacy - for backward compatibility)
          comments: [...selfComments, ...peerComments, ...directComments, ...managerComments],

          // FIXED: Separate comments by survey type with correct mapping
          selfComments, // From supervisor type submissions
          peerComments, // From employee type submissions
          directComments, // From director type submissions
          managerComments, // From manager type submissions

          // Store counts for each survey type
          surveyTypeCounts: {
            self: submissions.supervisor.length, // supervisor type = self assessment
            peer: submissions.employee.length, // employee type = peer assessment
            direct: submissions.director.length, // director type = direct assessment
            manager: submissions.manager.length, // manager type = manager assessment
          },

          aggregatedPeerId: `PEER-${managerName.replace(/\s+/g, "-").toUpperCase()}`,
        } as AggregatedSubmission

        console.log("🔍 Created aggregated submission with comment counts:", {
          selfComments: aggregatedSubmission.selfComments?.length || 0,
          peerComments: aggregatedSubmission.peerComments?.length || 0,
          directComments: aggregatedSubmission.directComments?.length || 0,
          managerComments: aggregatedSubmission.managerComments?.length || 0,
        })

        return aggregatedSubmission
      })
      .filter(Boolean) as AggregatedSubmission[]

    console.log("🔍 Final aggregated submissions:", aggregatedEmployeeSubmissions.length)

    return {
      aggregatedEmployeeSubmissions,
      supervisorSubmissions: allSubmissions.filter((sub) => sub.type === "supervisor"),
      directorSubmissions: allSubmissions.filter((sub) => sub.type === "director"),
      managerSubmissions: allSubmissions.filter((sub) => sub.type === "manager"),
    }
  }

  private aggregateResponses(submissions: SurveyResponse[], debugLabel = "") {
    console.log(`🔍 aggregateResponses [${debugLabel}] - Processing`, submissions.length, "submissions")

    if (submissions.length === 0) {
      console.log(`🔍 [${debugLabel}] No submissions to aggregate`)
      return []
    }

    const sectionMap = new Map<
      string,
      {
        id: string
        title: string
        questions: Map<
          string,
          {
            questionId: string
            questionText: string
            responses: {
              never: number
              rarely: number
              sometimes: number
              often: number
              always: number
            }
          }
        >
      }
    >()

    // Initialize sections and questions
    submissions.forEach((submission, submissionIndex) => {
      console.log(`🔍 [${debugLabel}] Processing submission ${submissionIndex + 1}:`, {
        type: submission.type,
        managerName: submission.managerName,
        responsesKeys: Object.keys(submission.responses || {}),
        sampleResponse: submission.responses ? Object.entries(submission.responses)[0] : null,
      })

      if (!submission.responses) {
        console.warn(`🔍 [${debugLabel}] Submission has no responses:`, submission)
        return
      }

      Object.entries(submission.responses).forEach(([sectionId, questions]) => {
        console.log(
          `🔍 [${debugLabel}] Processing section ${sectionId} with ${Object.keys(questions || {}).length} questions`,
        )

        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, {
            id: sectionId,
            title: this.getSectionTitle(sectionId),
            questions: new Map(),
          })
          console.log(`🔍 [${debugLabel}] Created new section: ${sectionId} - ${this.getSectionTitle(sectionId)}`)
        }

        const section = sectionMap.get(sectionId)!

        Object.entries(questions || {}).forEach(([questionId, response]) => {
          console.log(`🔍 [${debugLabel}] Processing question ${questionId} with response: ${response}`)

          if (!section.questions.has(questionId)) {
            section.questions.set(questionId, {
              questionId,
              questionText: this.getQuestionText(sectionId, questionId),
              responses: {
                never: 0,
                rarely: 0,
                sometimes: 0,
                often: 0,
                always: 0,
              },
            })
            console.log(`🔍 [${debugLabel}] Created new question: ${questionId}`)
          }

          const question = section.questions.get(questionId)!

          // Convert numeric responses to text keys
          const responseMap: Record<string, keyof typeof question.responses> = {
            "1": "never",
            "2": "rarely",
            "3": "sometimes",
            "4": "often",
            "5": "always",
            never: "never",
            rarely: "rarely",
            sometimes: "sometimes",
            often: "often",
            always: "always",
          }

          const responseKey = responseMap[response.toString()]

          if (responseKey && responseKey in question.responses) {
            question.responses[responseKey]++
            console.log(
              `🔍 [${debugLabel}] Incremented ${responseKey} for question ${questionId}. New count:`,
              question.responses[responseKey],
            )
          } else {
            console.warn(`🔍 [${debugLabel}] Invalid response: ${response} for question ${questionId}`)
          }
        })
      })
    })

    // Convert maps to arrays
    const result = Array.from(sectionMap.values()).map((section) => ({
      ...section,
      questions: Array.from(section.questions.values()),
    }))

    console.log(`🔍 [${debugLabel}] Aggregation result:`, {
      sectionsCount: result.length,
      sections: result.map((s) => ({
        id: s.id,
        title: s.title,
        questionsCount: s.questions.length,
        sampleQuestion: s.questions[0]
          ? {
              id: s.questions[0].questionId,
              text: s.questions[0].questionText,
              responses: s.questions[0].responses,
              totalResponses: Object.values(s.questions[0].responses).reduce((a, b) => a + b, 0),
            }
          : null,
      })),
    })

    return result
  }

  private getSectionTitle(sectionId: string): string {
    const sectionTitles: Record<string, string> = {
      "building-trust": "Building Trust",
      "communicating-effectively": "Communicating Effectively",
      "collaborating-effectively": "Collaborating Effectively",
      "driving-accountability": "Driving Accountability and Results",
      "motivating-others": "Motivating Others",
      "developing-others": "Developing Others",
      trust: "Trust & Integrity",
      communication: "Communication",
      collaboration: "Collaboration & Teamwork",
      accountability: "Accountability & Results",
      motivation: "Motivation & Development",
      development: "Strategic Leadership",
    }

    return sectionTitles[sectionId] || sectionId.charAt(0).toUpperCase() + sectionId.slice(1)
  }

  private getQuestionText(sectionId: string, questionId: string): string {
    // In a real app, this would look up the actual question text
    return `Question ${questionId.split("-")[2] || questionId.split("_")[1] || ""} in ${this.getSectionTitle(sectionId)}`
  }

  async updateSubmission(id: string, updates: Partial<SurveyResponse>): Promise<void> {
    if (typeof window === "undefined") return

    try {
      const submissions = this.getSubmissions()
      const index = submissions.findIndex((s) => s.id === id)

      if (index === -1) {
        throw new Error(`Submission with ID ${id} not found`)
      }

      submissions[index] = {
        ...submissions[index],
        ...updates,
        lastModified: new Date(),
      }

      localStorage.setItem(this.storageKey, JSON.stringify(submissions))
    } catch (error) {
      console.error("Error updating submission:", error)
      throw error
    }
  }

  async deleteSubmission(id: string): Promise<void> {
    if (typeof window === "undefined") return

    try {
      const submissions = this.getSubmissions()
      const filtered = submissions.filter((s) => s.id !== id)

      localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting submission:", error)
      throw error
    }
  }

  async deleteAggregatedSubmission(managerName: string): Promise<void> {
    if (typeof window === "undefined") return

    try {
      const submissions = this.getSubmissions()
      const filtered = submissions.filter((s) => !(s.type === "employee" && s.managerName === managerName))

      localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting aggregated submission:", error)
      throw error
    }
  }

  async getStats(): Promise<SurveyStats> {
    const submissions = this.getSubmissions()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedToday = submissions.filter((s) => {
      const submittedDate = new Date(s.submittedAt)
      submittedDate.setHours(0, 0, 0, 0)
      return submittedDate.getTime() === today.getTime()
    }).length

    return {
      totalSubmissions: submissions.length,
      employeeSubmissions: submissions.filter((s) => s.type === "employee").length,
      supervisorSubmissions: submissions.filter((s) => s.type === "supervisor").length,
      directorSubmissions: submissions.filter((s) => s.type === "director").length,
      managerSubmissions: submissions.filter((s) => s.type === "manager").length,
      completedToday,
      responseRate: 85, // Mock data
      averageCompletionTime: 12, // Mock data in minutes
    }
  }

  clearSubmissions(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(this.storageKey)
      console.log("🗑️ Cleared all submissions from localStorage")
    } catch (error) {
      console.error("Error clearing submissions:", error)
    }
  }
}

export const dataStore = new DataStore()
