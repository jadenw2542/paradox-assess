import { Routes } from '@angular/router';
import { UploadComponent } from './pages/upload/upload.component';
import { ViewComponent } from './pages/view/view.component';

export const routes: Routes = [
  { path: 'upload', component: UploadComponent },
  { path: 'view/:filename', component: ViewComponent },
  { path: '', redirectTo: '/upload', pathMatch: 'full' }
];