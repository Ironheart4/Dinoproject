import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { 
  Brain, FileText, Image, Dna, BarChart3, Loader2, Rocket, 
  Trophy, PartyPopper, ThumbsUp, BookOpen, RefreshCw, Check, 
  X, Save, Lightbulb, CircleCheck
} from 'lucide-react'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const API_BASE = 'http://localhost:5000'

interface Question {
  id: number
  questionType: 'text' | 'image' | 'identify'
  questionText: string
  imageUrl?: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  difficulty: string
}

type Stage = 'setup' | 'quiz' | 'results'

export default function Quiz() {
  useDocumentTitle('Dinosaur Quiz');
  const { user, token } = useAuth()
  const [stage, setStage] = useState<Stage>('setup')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(10)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [savingScore, setSavingScore] = useState(false)

  async function startQuiz() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/quiz/random?count=${questionCount}`)
      if (!res.ok) throw new Error('Failed to fetch questions')
      const data = await res.json()
      
      if (data.length === 0) {
        alert('No quiz questions available yet. Please ask an admin to create some quizzes!')
        return
      }
      
      setQuestions(data)
      setStage('quiz')
      setCurrentQ(0)
      setScore(0)
      setAnswers([])
      setSelectedAnswer(null)
      setShowFeedback(false)
    } catch (err) {
      console.error(err)
      alert('Failed to load quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(option: 'A' | 'B' | 'C' | 'D') {
    if (showFeedback) return // Prevent multiple clicks
    
    setSelectedAnswer(option)
    setShowFeedback(true)
    
    const isCorrect = option === questions[currentQ].correctAnswer
    const newScore = isCorrect ? score + 1 : score
    setScore(newScore)
    setAnswers([...answers, option])

    // Auto-advance after delay
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1)
        setSelectedAnswer(null)
        setShowFeedback(false)
      } else {
        setStage('results')
        // Save score if logged in
        if (user && token) {
          saveScore(newScore)
        }
      }
    }, 1500)
  }

  async function saveScore(finalScore: number) {
    if (!token) return
    setSavingScore(true)
    try {
      await fetch(`${API_BASE}/api/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: 1, // Default quiz ID for random questions
          score: finalScore,
          totalQuestions: questions.length,
        }),
      })
    } catch (err) {
      console.error('Failed to save score:', err)
    } finally {
      setSavingScore(false)
    }
  }

  function restartQuiz() {
    setStage('setup')
    setQuestions([])
    setCurrentQ(0)
    setScore(0)
    setAnswers([])
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  const getOptionClass = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!showFeedback) {
      return 'bg-gray-700 border-gray-600 hover:border-green-500 hover:bg-gray-600'
    }
    
    const correct = questions[currentQ].correctAnswer
    if (option === correct) {
      return 'bg-green-600 border-green-500 text-white'
    }
    if (option === selectedAnswer && option !== correct) {
      return 'bg-red-600 border-red-500 text-white'
    }
    return 'bg-gray-700 border-gray-600 opacity-50'
  }

  // SETUP STAGE
  if (stage === 'setup') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3"><Dna className="text-green-400" /> Dino Knowledge Quiz</h2>
          <p className="text-gray-400 text-lg">Test your prehistoric knowledge!</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Brain size={96} className="mx-auto text-green-400 mb-6" />
          
          <h3 className="text-xl font-semibold text-white mb-6">How many questions would you like?</h3>
          
          <div className="flex justify-center gap-3 flex-wrap mb-8">
            {[5, 7, 10, 15, 20].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  questionCount === count
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {count} Questions
              </button>
            ))}
          </div>

          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-white mb-2">Quiz Features:</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li className="flex items-center gap-2"><FileText size={14} /> Text-based questions about dinosaurs</li>
              <li className="flex items-center gap-2"><Image size={14} /> Image identification challenges</li>
              <li className="flex items-center gap-2"><Dna size={14} /> "Identify this dinosaur" questions</li>
              <li className="flex items-center gap-2"><BarChart3 size={14} /> {user ? 'Your score will be saved!' : 'Login to save your scores'}</li>
            </ul>
          </div>

          <button
            onClick={startQuiz}
            disabled={loading}
            className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-xl disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? <><Loader2 className="animate-spin" size={20} /> Loading...</> : <><Rocket size={20} /> Start Quiz</>}
          </button>
        </div>
      </div>
    )
  }

  // QUIZ STAGE
  if (stage === 'quiz' && questions.length > 0) {
    const q = questions[currentQ]
    const progress = ((currentQ + 1) / questions.length) * 100

    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">
              Question {currentQ + 1} of {questions.length}
            </span>
            <span className="text-green-400 font-semibold">
              Score: {score}/{currentQ + (showFeedback ? 1 : 0)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-lg p-8">
          {/* Difficulty Badge */}
          <div className="flex justify-between items-start mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              q.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
              q.difficulty === 'hard' ? 'bg-red-900 text-red-300' :
              'bg-yellow-900 text-yellow-300'
            }`}>
              {q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'hard' ? 'Hard' : 'Medium'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
              q.questionType === 'text' ? 'bg-blue-900 text-blue-300' :
              q.questionType === 'image' ? 'bg-purple-900 text-purple-300' :
              'bg-orange-900 text-orange-300'
            }`}>
              {q.questionType === 'text' ? <FileText size={12} /> : q.questionType === 'image' ? <Image size={12} /> : <Dna size={12} />} {q.questionType}
            </span>
          </div>

          {/* Image (if applicable) */}
          {(q.questionType === 'image' || q.questionType === 'identify') && q.imageUrl && (
            <div className="mb-6">
              <img
                src={q.imageUrl}
                alt="Question"
                loading="lazy"
                className="w-full max-h-64 object-contain rounded-lg bg-gray-900"
              />
            </div>
          )}

          {/* Question Text */}
          <h3 className="text-2xl font-semibold text-white mb-6">{q.questionText}</h3>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={showFeedback}
                className={`p-4 text-left rounded-lg border-2 transition font-medium ${getOptionClass(opt)} disabled:cursor-not-allowed`}
              >
                <span className="font-bold mr-2">{opt}.</span>
                {q[`option${opt}` as keyof Question]}
                {showFeedback && opt === q.correctAnswer && (
                  <Check size={16} className="ml-2 inline" />
                )}
                {showFeedback && opt === selectedAnswer && opt !== q.correctAnswer && (
                  <X size={16} className="ml-2 inline" />
                )}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              selectedAnswer === q.correctAnswer
                ? 'bg-green-900/50 text-green-300'
                : 'bg-red-900/50 text-red-300'
            }`}>
              {selectedAnswer === q.correctAnswer ? (
                <p className="text-lg font-semibold flex items-center justify-center gap-2"><PartyPopper size={20} /> Correct!</p>
              ) : (
                <p className="text-lg font-semibold flex items-center justify-center gap-2">
                  <X size={20} /> Incorrect! The answer was {q.correctAnswer}: {q[`option${q.correctAnswer}` as keyof Question]}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // RESULTS STAGE
  if (stage === 'results') {
    const percentage = Math.round((score / questions.length) * 100)
    const getMessage = () => {
      if (percentage >= 90) return { icon: Trophy, text: 'Outstanding! You\'re a dino expert!', color: 'text-yellow-400' }
      if (percentage >= 70) return { icon: PartyPopper, text: 'Great job! You know your dinosaurs!', color: 'text-green-400' }
      if (percentage >= 50) return { icon: ThumbsUp, text: 'Not bad! Keep learning!', color: 'text-blue-400' }
      return { icon: BookOpen, text: 'Keep studying! You\'ll improve!', color: 'text-purple-400' }
    }
    const result = getMessage()
    const ResultIcon = result.icon

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-gray-800 rounded-lg p-8">
          <ResultIcon size={96} className={`mx-auto mb-4 ${result.color}`} />
          <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-gray-400 mb-6">{result.text}</p>

          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 mb-6">
            <div className="text-6xl font-bold text-white mb-2">
              {score}/{questions.length}
            </div>
            <div className="text-2xl text-green-200">{percentage}%</div>
          </div>

          {savingScore && (
            <p className="text-gray-400 mb-4 flex items-center justify-center gap-2"><Save size={16} className="animate-pulse" /> Saving your score...</p>
          )}

          {user && !savingScore && (
            <p className="text-green-400 mb-4 flex items-center justify-center gap-2"><CircleCheck size={16} /> Score saved to your profile!</p>
          )}

          {!user && (
            <p className="text-yellow-400 mb-4 flex items-center justify-center gap-2">
              <Lightbulb size={16} /> <a href="/login" className="underline">Login</a> to save your scores and track progress!
            </p>
          )}

          {/* Answer Summary */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-white mb-3">Summary:</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    answers[i] === q.correctAnswer
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                  title={`Q${i + 1}: ${answers[i] === q.correctAnswer ? 'Correct' : 'Wrong'}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={restartQuiz}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <RefreshCw size={18} /> Try Again
            </button>
            <a
              href="/encyclopedia"
              className="px-8 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition flex items-center gap-2"
            >
              <BookOpen size={18} /> Study More
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
