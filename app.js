class GridSlideshowApp {
    constructor() {
        this.availableImages = ["1.png", "2.png", "3.jpg", "4.png", "5.jpg", "6.jpg"];
        this.slideInterval = 10000; // 10 seconds
        this.currentImageIndex = 0;
        this.countdownInterval = null;
        this.slideShowInterval = null;
        this.startTime = null;
        this.config = {};
        this.currentState = 'form';
        
        this.initializeElements();
        this.bindEvents();
        this.setMinDateTime();
        this.updateGridOptions();
    }

    initializeElements() {
        // Form elements
        this.formContainer = document.getElementById('form-container');
        this.slideshowForm = document.getElementById('slideshow-form');
        this.gridRowsInput = document.getElementById('grid-rows');
        this.gridColsInput = document.getElementById('grid-cols');
        this.targetRowSelect = document.getElementById('target-row');
        this.targetColSelect = document.getElementById('target-col');
        this.startTimeInput = document.getElementById('start-time');

        // Countdown elements
        this.countdownContainer = document.getElementById('countdown-container');
        this.countdownTimer = document.getElementById('countdown-timer');
        this.settingsSummary = document.getElementById('settings-summary');

        // Slideshow elements
        this.slideshowContainer = document.getElementById('slideshow-container');
        this.imageCanvas = document.getElementById('image-canvas');
        this.canvasContext = this.imageCanvas.getContext('2d');
        this.loadingIndicator = document.getElementById('loading-indicator');

        // Error elements
        this.errorContainer = document.getElementById('error-container');
        this.errorText = document.getElementById('error-text');

        // Reset buttons
        this.resetFromCountdownBtn = document.getElementById('reset-from-countdown');
        this.resetFromErrorBtn = document.getElementById('reset-from-error');

        // Add mobile fullscreen detection
        this.initializeMobileFullscreen();
    }

    // Add this new method to the GridSlideshowApp class
    initializeMobileFullscreen() {
        const isPWAStandalone = () => {
            return window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://') ||
                // Check for PWA launch from home screen
                !window.matchMedia('(display-mode: browser)').matches;
        };
        
        if (isPWAStandalone()) {
            document.body.classList.add('pwa-standalone');
            console.log('Running as PWA');
        }
        
        // Add install prompt handling
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA is installable');
            // Store the event for later use
            window.deferredPrompt = e;
        });
    }

    resizeCanvasForMobile() {
        if (!this.imageCanvas || !this.canvasContext) return;

        const isMobile = window.innerWidth <= 768;
        const isPWA = document.body.classList.contains('pwa-standalone');

        if (isMobile && isPWA && this.currentState === 'slideshow') {
            // Force canvas to use full viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Get the current image being displayed
            const currentImage = new Image();
            currentImage.src = this.availableImages[this.currentImageIndex];
            
            currentImage.onload = () => {
                // Calculate the canvas size to fit the viewport while maintaining aspect ratio
                const imgAspectRatio = currentImage.width / currentImage.height;
                const viewportAspectRatio = viewportWidth / viewportHeight;
                
                let canvasWidth, canvasHeight;
                
                if (imgAspectRatio > viewportAspectRatio) {
                    // Image is wider than viewport
                    canvasWidth = viewportWidth;
                    canvasHeight = viewportWidth / imgAspectRatio;
                } else {
                    // Image is taller than viewport
                    canvasHeight = viewportHeight;
                    canvasWidth = viewportHeight * imgAspectRatio;
                }
                
                // Update canvas dimensions
                this.imageCanvas.width = canvasWidth;
                this.imageCanvas.height = canvasHeight;
                
                // Redraw the current image segment with new dimensions
                this.displayImageSegment(currentImage);
            };
        }
    }

    bindEvents() {
        this.slideshowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submitted'); // Debug log
            this.handleFormSubmit(e);
        });
        
        this.gridRowsInput.addEventListener('input', () => this.updateGridOptions());
        this.gridColsInput.addEventListener('input', () => this.updateGridOptions());
        
        this.resetFromCountdownBtn.addEventListener('click', () => this.resetToForm());
        this.resetFromErrorBtn.addEventListener('click', () => this.resetToForm());
    }

    setMinDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1); // Minimum 1 minute from now
        this.startTimeInput.min = this.formatDateTimeLocal(now);
        
        // Set default to 5 minutes from now
        const defaultTime = new Date();
        defaultTime.setMinutes(defaultTime.getMinutes() + 5);
        this.startTimeInput.value = this.formatDateTimeLocal(defaultTime);
    }

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    updateGridOptions() {
        const rows = parseInt(this.gridRowsInput.value) || 1;
        const cols = parseInt(this.gridColsInput.value) || 1;

        // Store current selections
        const currentRow = this.targetRowSelect.value;
        const currentCol = this.targetColSelect.value;

        // Update row options
        this.targetRowSelect.innerHTML = '';
        for (let i = 1; i <= rows; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Row ${i}`;
            if (i.toString() === currentRow || (currentRow === '' && i === 1)) {
                option.selected = true;
            }
            this.targetRowSelect.appendChild(option);
        }

        // Update column options
        this.targetColSelect.innerHTML = '';
        for (let i = 1; i <= cols; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Column ${i}`;
            if (i.toString() === currentCol || (currentCol === '' && i === 1)) {
                option.selected = true;
            }
            this.targetColSelect.appendChild(option);
        }
    }

    handleFormSubmit(e) {
        console.log('Handling form submit'); // Debug log
        
        if (!this.validateForm()) {
            console.log('Form validation failed'); // Debug log
            return;
        }

        this.config = {
            gridRows: parseInt(this.gridRowsInput.value),
            gridCols: parseInt(this.gridColsInput.value),
            targetRow: parseInt(this.targetRowSelect.value),
            targetCol: parseInt(this.targetColSelect.value),
            startTime: new Date(this.startTimeInput.value)
        };

        console.log('Configuration:', this.config); // Debug log
        this.startCountdown();
    }

    validateForm() {
        let isValid = true;

        // Clear previous errors
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.form-error').forEach(el => el.remove());

        // Validate grid dimensions
        const rows = parseInt(this.gridRowsInput.value);
        const cols = parseInt(this.gridColsInput.value);
        
        if (!rows || rows < 1 || rows > 100) {
            this.showFieldError(this.gridRowsInput, 'Rows must be between 1 and 100');
            isValid = false;
        }

        if (!cols || cols < 1 || cols > 100) {
            this.showFieldError(this.gridColsInput, 'Columns must be between 1 and 100');
            isValid = false;
        }

        // Validate start time
        const startTime = new Date(this.startTimeInput.value);
        const now = new Date();
        
        if (isNaN(startTime.getTime())) {
            this.showFieldError(this.startTimeInput, 'Please select a valid start time');
            isValid = false;
        } else if (startTime <= now) {
            this.showFieldError(this.startTimeInput, 'Start time must be in the future');
            isValid = false;
        }

        console.log('Form validation result:', isValid); // Debug log
        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        const errorElement = document.createElement('span');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    startCountdown() {
        console.log('Starting countdown'); // Debug log
        this.switchToState('countdown');
        this.updateSettingsSummary();
        
        // Update countdown immediately
        const now = new Date();
        const timeLeft = this.config.startTime - now;
        this.updateCountdownDisplay(timeLeft);
        
        this.countdownInterval = setInterval(() => {
            const now = new Date();
            const timeLeft = this.config.startTime - now;
            
            if (timeLeft <= 0) {
                clearInterval(this.countdownInterval);
                this.startSlideshow();
            } else {
                this.updateCountdownDisplay(timeLeft);
            }
        }, 1000);
    }

    updateSettingsSummary() {
        const summary = `
            Grid: ${this.config.gridRows} × ${this.config.gridCols} | 
            Target: Row ${this.config.targetRow}, Column ${this.config.targetCol} | 
            Start: ${this.config.startTime.toLocaleString()}
        `;
        this.settingsSummary.textContent = summary;
    }

    updateCountdownDisplay(timeLeft) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        this.countdownTimer.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startSlideshow() {
        console.log('Starting slideshow'); // Debug log
        this.switchToState('slideshow');
        this.currentImageIndex = 0;
        // Add mobile fullscreen setup
        this.setupMobileFullscreen();
        
        this.loadAndDisplayImage();
        
        this.slideShowInterval = setInterval(() => {
            if (!this.isPaused) {
                this.nextImage();
            }
        }, this.slideInterval);
    }

    setupMobileFullscreen() {
        const isMobile = window.innerWidth <= 768;
        const isPWA = document.body.classList.contains('pwa-standalone');
        
        if (isMobile && isPWA) {
            // Add mobile fullscreen class
            this.slideshowContainer.classList.add('mobile-fullscreen');
            
            // Hide slideshow header on mobile fullscreen (optional)
            const slideshowHeader = this.slideshowContainer.querySelector('.slideshow-header');
            if (slideshowHeader) {
                slideshowHeader.style.display = 'none';
            }
            
            // Force viewport meta tag for better mobile handling
            let viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                viewportMeta.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no');
            }
        }
    }

    loadAndDisplayImage() {
        const imageName = this.availableImages[this.currentImageIndex];
        this.showLoadingIndicator(true);
        this.updateImageInfo();
        // this.startImageProgressBar();
        
        const img = new Image();
        img.onload = () => {
            this.displayImageSegment(img);
            this.showLoadingIndicator(false);
        };
        
        img.onerror = () => {
            console.warn(`Failed to load image: ${imageName}`);
            this.showLoadingIndicator(false);
            this.nextImage(); // Skip to next image
        };
        
        img.src = imageName;
    }

    displayImageSegment(img) {
        const isMobile = window.innerWidth <= 768;
        const isPWA = document.body.classList.contains('pwa-standalone');
        
        if (isMobile && isPWA && this.currentState === 'slideshow') {
            // Mobile PWA fullscreen logic - FILL ENTIRE SCREEN
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate segment dimensions based on original image
            const segmentWidth = Math.floor(img.width / this.config.gridCols);
            const segmentHeight = Math.floor(img.height / this.config.gridRows);
            const sourceX = (this.config.targetCol - 1) * segmentWidth;
            const sourceY = (this.config.targetRow - 1) * segmentHeight;
            
            // Set canvas to EXACTLY fill the viewport
            this.imageCanvas.width = viewportWidth;
            this.imageCanvas.height = viewportHeight;
            
            // Calculate scaling to fill screen (may crop image to avoid white space)
            const segmentAspectRatio = segmentWidth / segmentHeight;
            const viewportAspectRatio = viewportWidth / viewportHeight;
            
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
            
            if (segmentAspectRatio > viewportAspectRatio) {
                // Image is wider - scale to fill height, crop width if needed
                drawHeight = viewportHeight;
                drawWidth = viewportHeight * segmentAspectRatio;
                offsetX = -(drawWidth - viewportWidth) / 2; // Center horizontally
            } else {
                // Image is taller - scale to fill width, crop height if needed
                drawWidth = viewportWidth;
                drawHeight = viewportWidth / segmentAspectRatio;
                offsetY = -(drawHeight - viewportHeight) / 2; // Center vertically
            }
            
            // Clear canvas with black background first
            this.canvasContext.fillStyle = 'black';
            this.canvasContext.fillRect(0, 0, viewportWidth, viewportHeight);
            
            // Draw the segment scaled to fill entire screen
            this.canvasContext.drawImage(
                img,
                sourceX, sourceY, segmentWidth, segmentHeight,
                offsetX, offsetY, drawWidth, drawHeight
            );
        } else {
            // Original desktop logic (unchanged)
            const segmentWidth = Math.floor(img.width / this.config.gridCols);
            const segmentHeight = Math.floor(img.height / this.config.gridRows);
            const sourceX = (this.config.targetCol - 1) * segmentWidth;
            const sourceY = (this.config.targetRow - 1) * segmentHeight;

            this.imageCanvas.width = segmentWidth;
            this.imageCanvas.height = segmentHeight;

            this.canvasContext.drawImage(
                img,
                sourceX, sourceY, segmentWidth, segmentHeight,
                0, 0, segmentWidth, segmentHeight
            );
        }
    }   

    updateImageInfo() {
        const imageName = this.availableImages[this.currentImageIndex];
    }

    startImageProgressBar() {
        let progress = 0;
        this.imageTimerBar.style.width = '0%';
        
        clearInterval(this.imageProgressInterval);
        this.imageProgressInterval = setInterval(() => {
            if (!this.isPaused) {
                progress += 100;
                const percentage = (progress / this.slideInterval) * 100;
                this.imageTimerBar.style.width = `${Math.min(percentage, 100)}%`;
            }
        }, 100);
    }

    nextImage() {
        this.currentImageIndex++;
        
        if (this.currentImageIndex >= this.availableImages.length) {
            this.endSlideshow();
        } else {
            this.loadAndDisplayImage();
        }
    }

    endSlideshow() {
        clearInterval(this.slideShowInterval);
        clearInterval(this.imageProgressInterval);
    }

    showLoadingIndicator(show) {
        this.loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    switchToState(state) {
        console.log('Switching to state:', state); // Debug log
        
        // Hide all states
        this.formContainer.classList.add('hidden');
        this.countdownContainer.classList.add('hidden');
        this.slideshowContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
        
        // Show target state
        switch (state) {
            case 'form':
                this.formContainer.classList.remove('hidden');
                break;
            case 'countdown':
                this.countdownContainer.classList.remove('hidden');
                break;
            case 'slideshow':
                this.slideshowContainer.classList.remove('hidden');
                break;
            case 'error':
                this.errorContainer.classList.remove('hidden');
                break;
        }
        
        this.currentState = state;
    }

    showError(message) {
        this.errorText.textContent = message;
        this.switchToState('error');
    }

    resetToForm() {
        console.log('Resetting to form'); // Debug log
        
        // Clear all intervals
        clearInterval(this.countdownInterval);
        clearInterval(this.slideShowInterval);
        clearInterval(this.imageProgressInterval);
        
        // Reset state
        this.isPaused = false;
        this.currentImageIndex = 0;
        // this.pauseBtn.classList.remove('hidden');
        // this.resumeBtn.classList.add('hidden');
        
        // Clear canvas
        if (this.canvasContext) {
            this.canvasContext.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        }
        
        // Reset progress bar
        // this.imageTimerBar.style.width = '0%';
        
        // Switch to form
        this.switchToState('form');
        
        // Reset form validation
        document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        
        // Reset form values to defaults
        this.setMinDateTime();
        this.updateGridOptions();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Grid Slideshow App'); // Debug log
    new GridSlideshowApp();
});