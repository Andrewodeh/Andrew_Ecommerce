import { Component } from '@angular/core';
import { FaceSection } from '../../face-section/face-section';
import { NewArrivalSection } from '../../new-arrival-section/new-arrival-section';
import { Footer } from '../../footer/footer';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [FaceSection,NewArrivalSection,Footer, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
