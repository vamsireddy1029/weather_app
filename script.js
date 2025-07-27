class WeatherDashboard {
    constructor() {
        this.OPENWEATHER_API_KEY = 'b1b15e88fa797225412429c1c50c122a1'; 
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        
        this.currentCity = 'Delhi';
        this.currentLat = 28.6139;
        this.currentLon = 77.2090;
        
        this.initializeEventListeners();
        this.updateCurrentDate();
        this.loadWeatherData();
    }

    initializeEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const locationBtn = document.getElementById('locationBtn');
        const cityInput = document.getElementById('cityInput');

        searchBtn.addEventListener('click', () => this.searchWeather());
        locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchWeather();
            }
        });
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('weatherContent').classList.add('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message = 'Failed to fetch weather data. Please try again.') {
        document.getElementById('errorMessage').classList.remove('hidden');
        document.getElementById('errorMessage').querySelector('p').textContent = message;
        document.getElementById('weatherContent').classList.add('hidden');
    }

    showWeatherContent() {
        document.getElementById('weatherContent').classList.remove('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
    }

    async searchWeather() {
        const cityInput = document.getElementById('cityInput');
        const city = cityInput.value.trim();
        
        if (!city) return;
        
        this.showLoading();
        
        try {
            const geoResponse = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.OPENWEATHER_API_KEY}`
            );
            
            if (!geoResponse.ok) {
                throw new Error('Failed to fetch city coordinates');
            }
            
            const geoData = await geoResponse.json();
            
            if (geoData.length === 0) {
                throw new Error('City not found');
            }
            
            this.currentLat = geoData[0].lat;
            this.currentLon = geoData[0].lon;
            this.currentCity = `${geoData[0].name}, ${geoData[0].country}`;
            
            await this.loadWeatherData();
            
        } catch (error) {
            console.error('Error searching weather:', error);
            this.hideLoading();
            this.showError('City not found. Please try another location.');
        }
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            this.showLoading();
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.currentLat = position.coords.latitude;
                    this.currentLon = position.coords.longitude;
                    
                    try {
                        const geoResponse = await fetch(
                            `https://api.openweathermap.org/geo/1.0/reverse?lat=${this.currentLat}&lon=${this.currentLon}&limit=1&appid=${this.OPENWEATHER_API_KEY}`
                        );
                        
                        if (geoResponse.ok) {
                            const geoData = await geoResponse.json();
                            if (geoData.length > 0) {
                                this.currentCity = `${geoData[0].name}, ${geoData[0].country}`;
                            }
                        }
                        
                        await this.loadWeatherData();
                        
                    } catch (error) {
                        console.error('Error getting location weather:', error);
                        this.hideLoading();
                        this.showError('Failed to get weather for your location');
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.hideLoading();
                    this.showError('Unable to access your location');
                }
            );
        } else {
            this.showError('Geolocation is not supported by this browser');
        }
    }

    async loadWeatherData() {
        try {
            const [currentWeather, forecastData] = await Promise.all([
                this.fetchCurrentWeather(),
                this.fetchForecastData()
            ]);

            this.hideLoading();
            this.updateCurrentWeather(currentWeather);
            this.updateForecast(forecastData);
            this.updateStats(forecastData, currentWeather);
            this.updateLastUpdated();
            this.showWeatherContent();

        } catch (error) {
            console.error('Error loading weather data:', error);
            this.hideLoading();
            this.showError('Failed to load weather data. Please check your connection.');
        }
    }

    async fetchCurrentWeather() {
        const response = await fetch(
            `${this.BASE_URL}/weather?lat=${this.currentLat}&lon=${this.currentLon}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch current weather');
        }
        
        return await response.json();
    }

    async fetchForecastData() {
        const response = await fetch(
            `${this.BASE_URL}/forecast?lat=${this.currentLat}&lon=${this.currentLon}&appid=${this.OPENWEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        return await response.json();
    }

    updateCurrentWeather(data) {
        document.getElementById('cityName').textContent = this.currentCity;
        document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('weatherDescription').textContent = data.weather[0].description;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    
        const hour = new Date().getHours();
        let uvIndex = 0;
        if (hour >= 10 && hour <= 16) {
            uvIndex = Math.floor(Math.random() * 5) + 3;
        } else if (hour >= 8 && hour < 10 || hour > 16 && hour <= 18) {
            uvIndex = Math.floor(Math.random() * 3) + 1;
        }
        document.getElementById('uvIndex').textContent = uvIndex;

        const iconElement = document.getElementById('weatherIcon');
        const iconCode = data.weather[0].icon;
        const iconMap = {
            '01d': 'fas fa-sun', '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun', '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud', '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud', '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain', '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain', '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt', '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake', '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog', '50n': 'fas fa-smog'
        };
        iconElement.className = iconMap[iconCode] || 'fas fa-sun';
    }

    updateForecast(data) {
        const container = document.getElementById('forecastContainer');
        container.innerHTML = '';
        const dailyForecasts = {};
        
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!dailyForecasts[dayKey]) {
                dailyForecasts[dayKey] = {
                    date: date,
                    temps: [],
                    weather: item.weather[0],
                    icon: item.weather[0].icon
                };
            }
            dailyForecasts[dayKey].temps.push(item.main.temp);
        });

        const dailyArray = Object.values(dailyForecasts).slice(0, 5);

        dailyArray.forEach(day => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
            const high = Math.round(Math.max(...day.temps));
            const low = Math.round(Math.min(...day.temps));
            
            const iconMap = {
                '01d': 'fas fa-sun', '01n': 'fas fa-sun',
                '02d': 'fas fa-cloud-sun', '02n': 'fas fa-cloud-sun',
                '03d': 'fas fa-cloud', '03n': 'fas fa-cloud',
                '04d': 'fas fa-cloud', '04n': 'fas fa-cloud',
                '09d': 'fas fa-cloud-rain', '09n': 'fas fa-cloud-rain',
                '10d': 'fas fa-cloud-rain', '10n': 'fas fa-cloud-rain',
                '11d': 'fas fa-bolt', '11n': 'fas fa-bolt',
                '13d': 'fas fa-snowflake', '13n': 'fas fa-snowflake',
                '50d': 'fas fa-smog', '50n': 'fas fa-smog'
            };

            forecastItem.innerHTML = `
                <div class="forecast-date">${dayName}</div>
                <div class="forecast-icon">
                    <i class="${iconMap[day.icon] || 'fas fa-sun'}"></i>
                </div>
                <div class="forecast-description">${day.weather.description}</div>
                <div class="forecast-temps">
                    <span class="forecast-high">${high}°</span>
                    <span class="forecast-low">${low}°</span>
                </div>
            `;
            
            container.appendChild(forecastItem);
        });
    }

    updateStats(data, currentWeather) {
        const forecastTemps = data.list.slice(0, 16).map(item => item.main.temp);
        const currentTemp = currentWeather.main.temp;
        const allTemps = [currentTemp, ...forecastTemps];
        
        const maxTemp = Math.max(...allTemps);
        const minTemp = Math.min(...allTemps);
        const avgTemp = allTemps.reduce((a, b) => a + b, 0) / allTemps.length;
        
        const firstHalf = forecastTemps.slice(0, Math.floor(forecastTemps.length / 2));
        const secondHalf = forecastTemps.slice(Math.floor(forecastTemps.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const trend = secondAvg > firstAvg ? '↗ Rising' : secondAvg < firstAvg ? '↘ Falling' : '→ Stable';

        document.getElementById('maxTemp').textContent = `${Math.round(maxTemp)}°C`;
        document.getElementById('minTemp').textContent = `${Math.round(minTemp)}°C`;
        document.getElementById('avgTemp').textContent = `${Math.round(avgTemp)}°C`;
        document.getElementById('tempTrend').textContent = trend;

        const now = new Date();
        const tempData = [
            {
                temp: currentTemp,
                time: now.toLocaleTimeString('en-US', { 
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                date: now
            },
            ...data.list.slice(0, 16).map(item => ({
                temp: item.main.temp,
                time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { 
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                date: new Date(item.dt * 1000)
            }))
        ];
        
        const maxTempPoint = tempData.reduce((max, current) => 
            current.temp > max.temp ? current : max
        );
        const minTempPoint = tempData.reduce((min, current) => 
            current.temp < min.temp ? current : min
        );
        
        const variation = Math.round((maxTempPoint.temp - minTempPoint.temp) * 10) / 10;
        
        document.getElementById('peakTime').textContent = maxTempPoint.time;
        document.getElementById('coolestTime').textContent = minTempPoint.time;
        document.getElementById('tempVariation').textContent = `${variation}°C`;
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WeatherDashboard();
});