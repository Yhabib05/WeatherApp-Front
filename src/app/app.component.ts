import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  username:string = '';
  city:string = 'Paris';
  favoriteCity: string | null = null;

  saveUser(){
    alert(`Hello ${this.username}`);
  }

  toggleFavorite(){
    console.log("toggleFavorite has been called");
    if(this.favoriteCity===this.city){
      this.favoriteCity = null;
    } else{
      this.favoriteCity = this.city;
    }
  }

  isFavorite():boolean{
    console.log("isFavorite called", this.favoriteCity === this.city);
    return this.favoriteCity === this.city;
  }

}

