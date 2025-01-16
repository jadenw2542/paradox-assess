import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { QuizService, QuizOptions, QuizQuestionMultipleChoice, QuizQuestioOpenEnded, QuizResponse, QuizType, QuestionType } from '../../services/quiz.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatRadioModule,
    MatCardModule,
    MatFormFieldModule,
  ],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css'
})
export class QuizComponent {
  quizOptions: QuizOptions | null = null;
  questions: any[] = [];
  currentQuestionIndex = 0;
  selectedAnswer: string = '';
  userAnswer: string = '';
  isSubmitted = false;
  isLastQuestion = false;
  isGeneratingNewQuestions = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {
    const data = this.router.getCurrentNavigation()?.extras?.state;
    if (!data?.['quizData']) {
      this.router.navigate(['/']);
    }
    this.quizOptions = data?.['quizOptions'];
    const quizData = data?.['quizData'];
    if (quizData) {
      this.questions = quizData.questions;
      this.isLastQuestion = this.questions.length === 1;
    }
  }

  get currentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  isMultipleChoice(): boolean {
    return this.quizOptions?.selectedQuizType === 'multiple choice';
  }

  submitAnswer() {
    console.log(this.questions[this.currentQuestionIndex].sample_answer);
    this.isSubmitted = true;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;
      this.resetQuestion();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;
      this.resetQuestion();
    }
  }

  resetQuestion() {
    this.isSubmitted = false;
    this.selectedAnswer = '';
    this.userAnswer = '';
  }

  isCorrectAnswer(option: string): boolean {
    return this.isSubmitted && option === this.currentQuestion.correct_answer;
  }

  changeQuizSettings() {
    const navigationExtras: NavigationExtras = {
      state: {
        quizOptions: this.quizOptions
      }
    };
    this.router.navigate(['/view'], navigationExtras);
  }


  generateNewQuiz() {
    if (!this.quizOptions) {
      console.error('Quiz options are not set.');
      return;
    }
    this.isGeneratingNewQuestions = true;
  
    this.quizService.generateQuiz(
      this.quizOptions.fileName,
      this.quizOptions.selectedQuizType as QuizType,
      this.quizOptions.selectedQuestionType as QuestionType,
      this.quizOptions?.selectedNumOfQuestions as string
    ).subscribe({
      next: (response: any) => {
        const parsedBody = JSON.parse(response.body);
        const quizData: QuizResponse = JSON.parse(parsedBody);
  
        // Update the current component's data
        this.questions = quizData.questions;
        this.currentQuestionIndex = 0;
        this.isLastQuestion = this.questions.length === 1;
        this.resetQuestion();
  
      },
      error: (error) => {
        console.error('Error generating quiz:', error);
      },
      complete: () => {
        this.isGeneratingNewQuestions = false;
      }
    });
  }
}
