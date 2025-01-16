import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { QuizService, QuizOptions, QuizQuestionMultipleChoice, QuizQuestioOpenEnded, QuizResponse, QuizType, QuestionType } from '../../services/quiz.service';

import {FormGroup, FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-view',
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './view.component.html',
  styleUrl: './view.component.css'
})
export class ViewComponent implements OnInit {
  profileForm = new FormGroup({
    quizType: new FormControl('multiple choice'),
    questionType: new FormControl('recall'),
    numQuestions: new FormControl('1')
  });

  isGenerating = false;
  quizOptions: QuizOptions | null = null;

  numQuestionOptions: { value: string; viewValue: string }[] = [];


  quizTypeOptions = [
    {value: 'multiple choice', viewValue: 'multiple choice'},
    {value: 'open-ended', viewValue: 'open-ended'},
  ];

  questionTypeOptions = [
    {value: 'recall', viewValue: 'recall'},
    {value: 'analysis', viewValue: 'analysis'},
    {value: 'scenario', viewValue: 'scenario'},
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {
    this.quizOptions = this.router.getCurrentNavigation()?.extras?.state?.['quizOptions'];
    if (!this.quizOptions) {
      this.router.navigate(['/']);
    }

    for (let i = 1; i <= 6; i++) {
      this.numQuestionOptions.push({ value: i.toString(), viewValue: i.toString() });
    }
  }

  ngOnInit() {
    if (this.quizOptions) {
      this.profileForm.patchValue({
        quizType: this.quizOptions.selectedQuizType,
        questionType: this.quizOptions.selectedQuestionType,
        numQuestions: this.quizOptions.selectedNumOfQuestions
      });
    }
  }
  
  generateQuiz() {
    if (!this.quizOptions) {
      console.error('Quiz options are not set.');
      return;
    }

    const formValues = this.profileForm.value;
    this.isGenerating = true;
    this.profileForm.controls.quizType.disable();
    this.profileForm.controls.questionType.disable();
    this.profileForm.controls.numQuestions.disable();

    try {
      this.quizService.generateQuiz(
        this.quizOptions.fileName,
        formValues.quizType as QuizType,
        formValues.questionType as QuestionType,
        formValues.numQuestions as string
      ).subscribe({
        next: (response: any) => {
          // Parse the nested JSON string in the response
          const parsedBody = JSON.parse(response.body);
          const quizData: QuizResponse = JSON.parse(parsedBody);

          const navigationExtras: NavigationExtras = {
            state: {
              quizOptions: {
                ...this.quizOptions,
                selectedQuizType: formValues.quizType,
                selectedQuestionType: formValues.questionType,
                selectedNumOfQuestions: formValues.numQuestions
              },
              quizData: quizData
            }
          };
      
          this.router.navigate(['/quiz'], navigationExtras);
        },
        error: (error) => {
          console.error('Error generating quiz:', error);
        },
        complete: () => {
          this.isGenerating = false;
        }
      });

    } catch (error) {
      console.error('Error generating quiz:', error);
      this.isGenerating = false;
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}