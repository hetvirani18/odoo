import { useState, useEffect } from 'react';
import { questionService } from '../services/api';

/**
 * Custom hook for managing questions with search and filters
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} - Questions data and filter functions
 */
export const useQuestions = (initialFilters = {}) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sort: 'newest',
    search: '',
    tag: '',
    ...initialFilters
  });

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await questionService.getQuestions(filters);
      setQuestions(response.data.questions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      sort: 'newest',
      search: '',
      tag: '',
      ...initialFilters
    });
  };

  return {
    questions,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetchQuestions
  };
};

/**
 * Custom hook for managing a single question with answers
 * @param {string} questionId - The question ID
 * @returns {Object} - Question data and answer functions
 */
export const useQuestion = (questionId) => {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuestion = async () => {
    if (!questionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [questionResponse, answersResponse] = await Promise.all([
        questionService.getQuestion(questionId),
        questionService.getAnswers ? questionService.getAnswers(questionId) : Promise.resolve({ data: { answers: [] } })
      ]);
      
      setQuestion(questionResponse.data.question);
      setAnswers(answersResponse.data.answers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const addAnswer = (newAnswer) => {
    setAnswers(prev => [...prev, newAnswer]);
  };

  const updateAnswer = (answerId, updatedAnswer) => {
    setAnswers(prev => prev.map(answer => 
      answer._id === answerId ? { ...answer, ...updatedAnswer } : answer
    ));
  };

  return {
    question,
    answers,
    loading,
    error,
    addAnswer,
    updateAnswer,
    refetch: fetchQuestion
  };
};
