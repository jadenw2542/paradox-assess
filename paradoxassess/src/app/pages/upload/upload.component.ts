import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { S3Service } from '../../services/s3.service';
import { Router, NavigationExtras } from '@angular/router';
@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styles: [`
    .upload-container {
    }
    .upload-status {
      margin: 10px;
      padding: 10px;
      border-radius: 4px;
    }
    .file-list {
      margin-top: 20px;
    }
    .file-button {
      margin-top: 10px;
      max-width: 500px;
    }
  `],
  imports: [CommonModule],
})
export class UploadComponent {
  selectedFile: File | null = null;
  isUploading = false;
  uploadStatus = '';
  files: { fileName: string, isInDynamoDB: boolean }[] = [];

  constructor(private s3Service: S3Service, private router: Router) {
    this.loadFiles();
  }

  async loadFiles() {
    try {
      this.files = await this.s3Service.listFiles();
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    this.uploadStatus = '';
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadStatus = 'Please select a file first.';
      return;
    }

    this.isUploading = true;
    this.uploadStatus = 'Uploading...';

    try {
      await this.s3Service.uploadFile(this.selectedFile);
      this.uploadStatus = 'File uploaded successfully!';
      await this.loadFiles(); // Refresh the file list
      this.selectedFile = null;
    } catch (error) {
      this.uploadStatus = 'Error uploading file. Please try again.';
    } finally {
      this.isUploading = false;
    }
  }

  async deleteFile(fileName : string): Promise<void> {

    try{
      this.uploadStatus = await this.s3Service.deleteFile(fileName);
      await this.loadFiles();
    }
    catch(error) {
      this.uploadStatus = 'Error deleting file:';
    }
    finally{
      
    }
    
  }

  viewFile(file: string) {
    const generateQuizDefault = {
        fileName: file,
        selectedQuizType: 'multiple choice',
        selectedQuestionType: 'scenario',
        selectedNumOfQuestions: '1'
    };
    
    const navigationExtras: NavigationExtras = {
        state: {
            quizOptions: generateQuizDefault
        }
    };
    
    this.router.navigate(['/view'], navigationExtras);
}
  
}