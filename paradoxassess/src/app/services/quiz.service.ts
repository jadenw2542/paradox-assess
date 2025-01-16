import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface QuizOptions {
  fileName: string;
  selectedQuizType: QuizType;
  selectedQuestionType: QuestionType;
  selectedNumOfQuestions: string;
}

export interface QuizQuestionMultipleChoice {
  question: string;
  correct_answer: string;
  options: string[];
  explanations: { [key: string]: string };
}

export interface QuizQuestioOpenEnded{
  question: string;
  sample_answer: string;
}

export interface QuizResponse {
  questions: QuizQuestionMultipleChoice[] | QuizQuestioOpenEnded[];
}


export type QuizType = 'multiple choice' | 'open-ended';
export type QuestionType = 'recall' | 'analysis' | 'scenario';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  constructor(private http: HttpClient) {}

  generateQuiz(key: string, quizType: QuizType, questionType: QuestionType, num_questions: string) {
    const request = {
      "bucket": environment.s3BucketName,
      "key": key,
      "quiz_type": quizType,
      "question_type": questionType,
      "num_questions": num_questions
    };
  
    return this.http.post(`${environment.gatewayAPI}/generate-quiz`, request, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
  
}