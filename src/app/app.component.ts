import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {CommonModule, JsonPipe} from '@angular/common';

interface Coord {
  lat: number; lon: number;
}

interface City {
  name: string;
  cityCoord: Coord;
}

interface User {
  id: string;
  username: string;
  favoriteCity: City | null;
}

@Component({
  selector: 'app-root',
  standalone:true,
  imports: [RouterOutlet, FormsModule, JsonPipe, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  username:string = '';
  city1:string = 'paris';
  city2:string = 'toulouse';
  favoriteCity: string = '';
  userId: string = '';
  weatherInfo: any = null;
  cityCoords: { [city: string]: Coord } = {};
  savedCities: string[] = [];


constructor(private http: HttpClient) {}

  isEditingUser: boolean = false;


  saveUser() {
    const payload = {username: this.username};
    this.http.post<User>('http://localhost:8080/user', payload).subscribe({
      next: (res) => {
        this.userId = res.id;
        this.isEditingUser = false;
        alert(`User ${this.username} created!`);
      },
      error: () => alert('Error creating user'),
    });
  }
  setEditUser() {
    this.isEditingUser = true;
  }

  changeName(newName: string) {
    const payload = {id: this.userId};
    this.http.put<User>('http://localhost:8080/user', newName,{
      params: { id:this.userId }
    }).subscribe({
      next: (res) => {
        this.userId = res.id;
        this.username = res.username;
        this.isEditingUser = false;
        alert(`User name ${this.username} changed!`);
        },
      error: () => alert('Failed to change user name')
    })
  }

  newCityName: string = '';
  createdCities: string[] = [];

  addCity() {
    const city = this.newCityName.trim().toLowerCase();
    if (!city || this.createdCities.includes(city)) {
      alert('City name is empty or already exists');
      return;
    }

    this.createdCities.push(city);
    this.newCityName = '';
  }

  saveCity(city: string) {
    if (!this.savedCities.includes(city)) {
      this.savedCities.push(city);
      alert(`City "${city}" saved locally.`);
    } else {
      alert(`City "${city}" is already saved.`);
    }
  }

  getWeatherByCity(city: string) {
    this.http.get<any>('http://localhost:8080/weather/by-city', {
      params: { city }
    }).subscribe({
      next: (res) => {
        this.weatherInfo = res;
        console.log("Weather info for", city, res);

        const coord: Coord = {
          lat: res.coord.lat,
          lon: res.coord.lon,
        }
        this.cityCoords[city] = coord;

     },
      error: () => {
        alert(`Could not fetch weather for ${city}`);
      }
    });
  }


  toggleFavorite(city: string ) {
    if (!this.username || !this.userId) {
      alert('Save user first');
      return;
    }

    const coord = this.cityCoords[city];

    if (!coord) {
      alert('Cant save it to favorites, city wasnt correctly saved' );
      return;
    }

    const isSame = this.favoriteCity===city;
    console.log(isSame);

    if (isSame) {
      // Remove from favorite
      this.http
        .delete('http://localhost:8080/user/favorite', {
          body: coord,
          params: {userId: this.userId},
          responseType: "text" as const //bcs the backend returns a text: city removed from  favorite
        })
        .subscribe(() => {
          this.favoriteCity = '';
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

  isFavorite(city: string): boolean {
    return  this.favoriteCity==city;
  }
}

