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
  cityCoord: Coord | null;
  weatherInfos: any | null;
  temperature?: number; // optional, set after fetching the weather
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
  user: User | null = null;
  username: string = '';
  newCityName: string = '';
  createdCities: City[] = [];
  isEditingUser: boolean = false;

  constructor(private http: HttpClient) {}

  saveUser(): void {
    const payload = {username: this.username.trim() };
    if(!payload.username){
      alert('Username cannot be empty!');
      return;
    }
    this.http.post<User>('http://localhost:8080/users', payload).subscribe({
      next: (res) => {
        this.user = res;
        this.username = res.username;
        this.isEditingUser = false;
        alert(`User ${this.user.username} created!`);
      },
      error: (e) => alert('Error creating user' + e),
    });
  }

  setEditUser() {
    this.isEditingUser = true;
  }

  changeName(newName: string): void {
    if (!this.user || !newName.trim()) return;

    this.http.put<User>('http://localhost:8080/users', newName.trim(),{
      params: { id:this.user.id },
    }).subscribe({
      next: (res) => {
        this.user= res;
        this.username = res.username;
        this.isEditingUser = false;
        alert(`Username changed to ${res.username}`);
        },
      error: () => alert('Failed to change user name')
    })
  }

  addCity(): void {
    const name = this.newCityName.trim().toLowerCase();
    if (!name || this.createdCities.some(c => c.name === name)) {
      alert('City name is empty or already exists');
      return;
    }

    const city = {
      name,
      cityCoord:null,
      weatherInfos:null
    };
    this.createdCities.push(city);
    this.newCityName = '';
    this.getCoordFromCity(city);
  }


  getCoordFromCity(city: City): void {
    const cityFound = this.createdCities.find(c => c.name === city.name);
    if(!cityFound || cityFound.cityCoord) return;
    this.http.get<Coord>(`http://localhost:8080/coord/${cityFound.name}`).subscribe({
      next: (res) => {
        cityFound.cityCoord = {lat: res.lat, lon: res.lon};
        //get the temperature the first time when adding the city
        this.getTemperatureByCoord(cityFound);

        console.log(`the coordinates for the city ${cityFound.name} are: `, cityFound.cityCoord);
      },
      error: () => {
        alert(`Could not get coordinates for ${cityFound.name}`);
      }
    });
  }

  getWeatherByCoord(city: City): void {
    const cityFound = this.createdCities.find(c => c.name === city.name);
    if(!cityFound) return;
    const url = `http://localhost:8080/weather`;
    this.http.post<any>(url,cityFound.cityCoord).subscribe({
      next: (res) => {
        cityFound.weatherInfos = res
        cityFound.temperature = res.main?.temp-273.15;
      },
      error: () => {
        alert(`Could not fetch weather for ${cityFound.name}`);
      }
    });
  }

  getTemperatureByCoord(city: City): void {
    const cityFound = this.createdCities.find(c => c.name === city.name);
    if(!cityFound) return;
    const url = `http://localhost:8080/weather/temperature`;
    this.http.post<any>(url,cityFound.cityCoord).subscribe({
      next: (res) => {
        cityFound.temperature = res-273.15;
        console.log("Weather info for", cityFound.name, res);
      },
      error: () => {
        alert(`Could not fetch temperature for ${cityFound.name}`);
      }
    });
  }


  /* to remove */
  getWeatherByCity(cityName: string): void {
    this.http.get<any>('http://localhost:8080/weather/by-city', {
      params: { city: cityName }
    }).subscribe({
      next: (res) => {
        const city = this.createdCities.find(c => c.name === cityName);

        if(!city) return;

        city.cityCoord = {lat: res.coord.lat, lon: res.coord.lon};
        city.temperature = res.main?.temp-273.15;

        console.log("Weather info for", cityName, res);
     },
      error: () => {
        alert(`Could not fetch weather for ${cityName}`);
      }
    });
  }


  toggleFavorite(cityName: string ) {
    if (!this.user) {
      alert('Save user first');
      return;
    }

    const city = this.createdCities.find(c => c.name === cityName);
    if (!city || !city.cityCoord) {
      alert('City coord not found' );
      return;
    }

    const isFavorite = this.isFavorite(cityName);

    const url = `http://localhost:8080/users/${this.user.id}/favorite`;
    const options = {
      body: city.cityCoord,
      params:{ userId: this.user.id },
      responseType: 'text' as const
    }

    if (isFavorite) {
      // Remove from favorite
      this.http
        .delete(url,options)
        .subscribe({
        next: () => {
          this.user!.favoriteCity = null;
          alert(`${cityName} removed from favorites`);
        },
          error: () =>alert('Failed to remove favorite city')
        });
    } else {
      // Add to favorite
      this.http
        .post(url,city.cityCoord,{
            params:{userId: this.user.id},
          responseType: "text" as const //bcs the backend returns a text: city added to favorite
        })
        .subscribe({
          next: ()  =>{
            this.user!.favoriteCity = city;
            alert(`${cityName} added to favorites`);
          },
          error: ()=> alert('Error adding to favorites')
        });
    }
  }

  isFavorite(cityName: string): boolean {
    return  this.user?.favoriteCity?.name===cityName;
  }
}

