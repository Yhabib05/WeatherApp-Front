import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {JsonPipe} from '@angular/common';

interface Coord {
  lat: number; lon: number;
}
interface User {
  id: string;
  username: string;
  favoriteCoord: Coord | null;
}

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet, FormsModule, HttpClientModule, JsonPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  username:string = '';
  city1:Coord = {
    lat: 48.7189,
    lon: 2.2335,
  };
  city2:Coord = {
    lat: 0.0250,
    lon: 0.1515,
  };
  favoriteCity: Coord | null = null;
  userId: string = '';


constructor(private http: HttpClient) {}

  saveUser() {
    //alert(`Hello ${this.username}`);
    const payload = {username: this.username};
    this.http.post<User>('http://localhost:8080/user', payload).subscribe({
      next: (res) => {
        this.userId = res.id;
        alert(`User ${this.username} created!`);
      },
      error: () => alert('Error creating user'),
    });
  }

  toggleFavorite(city: Coord ) {
    if (!this.username || !this.userId) {
      alert('Save user first');
      return;
    }
    const isSame = this.favoriteCity?.lon ===city.lon && this.favoriteCity?.lat ===city.lat ;
    console.log(isSame);

    if (isSame) {
      // Remove from favorite
      this.http
        .delete('http://localhost:8080/user/favorite', {
          body: city,
          params: {userId: this.userId},
          responseType: "text" as const //bcs the backend returns a text: city removed from  favorite
        })
        .subscribe(() => {
          this.favoriteCity = null;
        });
    } else {
      // Add to favorite
      this.http
        .post(`http://localhost:8080/user/favorite`,city,{
            params:{userId: this.userId},
          responseType: "text" as const //bcs the backend returns a text: city added to favorite
        })
        .subscribe(() => {
          this.favoriteCity = city;
        });
    }
  }

  isFavorite(city: Coord): boolean {
    return  this.favoriteCity?.lon ===city.lon && this.favoriteCity?.lat ===city.lat ;
  }
}

