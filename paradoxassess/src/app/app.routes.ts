import { Routes } from '@angular/router';
import { UploadComponent } from './pages/upload/upload.component';
import { ViewComponent } from './pages/view/view.component';
import { QuizComponent } from './pages/quiz/quiz.component';

export const routes: Routes = [
  { path: 'upload', component: UploadComponent },
  { path: 'view', component: ViewComponent },
  { path: 'quiz', component: QuizComponent },
  { path: '', redirectTo: '/upload', pathMatch: 'full' }
];