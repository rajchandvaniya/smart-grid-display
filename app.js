// Image Segment Display System
class ImageSegmentDisplay {
    constructor() {
        this.params = this.parseURLParams();
        this.supportedFormats = ['png', 'jpeg', 'jpg', 'gif'];
        this.availableImages= ['1.png','2.png','3.jpg','4.png','5.jpg','6.jpg'];
        this.maxGridSize = { rows: 100, cols: 100 };
        this.currentImage = null;
        this.infoVisible = true;
        
        this.init();
    }

    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            imageName: urlParams.get('imageName'),
            gridSize: urlParams.get('gridSize'), 
            row: parseInt(urlParams.get('row')),
            column: parseInt(urlParams.get('column'))
        };
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.validateAndLoad();
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('toggleInfoBtn');
        const retryBtn = document.getElementById('retryBtn');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleInfo());
        }
        
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retry());
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.currentImage) {
                this.displaySegment();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.toggleInfo();
            } else if (e.key === 'r' || e.key === 'R') {
                this.retry();
            }
        });
    }

    updateUI() {
        const currentImageName = document.getElementById('currentImageName');
        const currentGridSize = document.getElementById('currentGridSize');
        const currentPosition = document.getElementById('currentPosition');
        
        if (currentImageName) {
            currentImageName.textContent = this.params.imageName || '-';
        }
        
        if (currentGridSize) {
            currentGridSize.textContent = this.params.gridSize || '-';
        }
        
        if (currentPosition) {
            const row = this.params.row;
            const col = this.params.column;
            currentPosition.textContent = (row && col) ? `${row},${col}` : '-';
        }
    }

    validateAndLoad() {
        try {
            // Validate parameters
            const validation = this.validateParams();
            if (!validation.valid) {
                this.showError(validation.error);
                return;
            }
            
            // Load and process image
            this.loadImage();
            
        } catch (error) {
            console.error('Error in validateAndLoad:', error);
            this.showError('An unexpected error occurred while loading the image segment.');
        }
    }

    validateParams() {
        // Check if all required parameters are present
        if (!this.params.imageName) {
            return {
                valid: false,
                error: 'Missing imageName parameter. Please specify the image file name.'
            };
        }
        
        if (!this.params.gridSize) {
            return {
                valid: false,
                error: 'Missing gridSize parameter. Please specify grid dimensions (e.g., "4x3").'
            };
        }
        
        if (!this.params.row || !this.params.column) {
            return {
                valid: false,
                error: 'Missing row or column parameter. Please specify both row and column numbers.'
            };
        }
        
        // Validate grid size format
        const gridMatch = this.params.gridSize.match(/^(\d+)x(\d+)$/);
        if (!gridMatch) {
            return {
                valid: false,
                error: 'Invalid gridSize format. Use format like "4x3" (rows x columns).'
            };
        }
        
        const rows = parseInt(gridMatch[1]);
        const cols = parseInt(gridMatch[2]);
        
        if (cols < 1 || rows < 1 || cols > this.maxGridSize.cols || rows > this.maxGridSize.rows) {
            return {
                valid: false,
                error: `Invalid grid size. Columns and rows must be between 1 and ${this.maxGridSize.cols}.`
            };
        }
        
        // Validate position
        if (this.params.row < 1 || this.params.row > rows) {
            return {
                valid: false,
                error: `Invalid row number. Row must be between 1 and ${rows}.`
            };
        }
        
        if (this.params.column < 1 || this.params.column > cols) {
            return {
                valid: false,
                error: `Invalid column number. Column must be between 1 and ${cols}.`
            };
        }
        
        // Validate image format
        const extension = this.params.imageName.toLowerCase().split('.').pop();
        if (!this.supportedFormats.includes(extension)) {
            return {
                valid: false,
                error: `Unsupported image format. Supported formats: ${this.supportedFormats.join(', ')}`
            };
        }
        
        return { valid: true };
    }

    loadImage() {
        this.showLoading();
        
        // Try to load from assets (in case images are actually provided)
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.processImage();
        };
        img.onerror = () => {
            this.showError(`Image not found: ${this.params.imageName}. Available images: ${Object.keys(this.availableImages).join(', ')}`);
        };
        img.src = this.params.imageName;
    }

    processImage() {
        try {
            const gridMatch = this.params.gridSize.match(/^(\d+)x(\d+)$/);
            const rows = parseInt(gridMatch[1]);
            const cols = parseInt(gridMatch[2]);
            
            const segmentWidth = this.currentImage.width / cols;
            const segmentHeight = this.currentImage.height / rows;
            
            const sourceX = (this.params.column - 1) * segmentWidth;
            const sourceY = (this.params.row - 1) * segmentHeight;
            
            this.segmentData = {
                sourceX,
                sourceY,
                segmentWidth,
                segmentHeight,
                cols,
                rows
            };
            
            this.displaySegment();
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.showError('Failed to process image segment.');
        }
    }

    displaySegment() {
        const canvas = document.getElementById('segmentCanvas');
        const ctx = canvas.getContext('2d');
        
        if (!canvas || !ctx || !this.currentImage || !this.segmentData) {
            return;
        }
        
        // Calculate display size while maintaining aspect ratio
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const aspectRatio = this.segmentData.segmentWidth / this.segmentData.segmentHeight;
        
        let displayWidth = this.segmentData.segmentWidth;
        let displayHeight = this.segmentData.segmentHeight;
        
        // Scale to fit screen
        const scaleX = (containerWidth * 0.95) / displayWidth;
        const scaleY = (containerHeight * 0.95) / displayHeight;
        const scale = Math.min(scaleX, scaleY, 2); // Cap at 2x for quality
        
        displayWidth *= scale;
        displayHeight *= scale;
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        
        // Draw the segment
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(
            this.currentImage,
            this.segmentData.sourceX,
            this.segmentData.sourceY,
            this.segmentData.segmentWidth,
            this.segmentData.segmentHeight,
            0,
            0,
            displayWidth,
            displayHeight
        );
        
        this.showDisplay();
    }

    showLoading() {
        this.hideAll();
        document.getElementById('loadingIndicator').classList.remove('hidden');
    }

    showDisplay() {
        this.hideAll();
        document.getElementById('displayContainer').classList.remove('hidden');
    }

    showError(message) {
        this.hideAll();
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        errorContainer.classList.remove('hidden');
    }

    hideAll() {
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('displayContainer').classList.add('hidden');
        document.getElementById('errorContainer').classList.add('hidden');
    }

    toggleInfo() {
        const segmentInfo = document.getElementById('segmentInfo');
        const toggleBtn = document.getElementById('toggleInfoBtn');
        
        if (segmentInfo && toggleBtn) {
            this.infoVisible = !this.infoVisible;
            
            if (this.infoVisible) {
                segmentInfo.classList.remove('hidden');
                toggleBtn.setAttribute('aria-label', 'Hide segment information');
            } else {
                segmentInfo.classList.add('hidden');
                toggleBtn.setAttribute('aria-label', 'Show segment information');
            }
        }
    }

    retry() {
        window.location.reload();
    }
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = 'A technical error occurred. Please refresh the page and try again.';
        
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('displayContainer').classList.add('hidden');
        errorContainer.classList.remove('hidden');
    }
});

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Image Segment Display...');
    try {
        window.imageSegmentDisplay = new ImageSegmentDisplay();
        console.log('Image Segment Display initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Image Segment Display:', error);
        
        // Fallback error display
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = 'Failed to initialize the application. Please refresh the page.';
            
            document.getElementById('loadingIndicator').classList.add('hidden');
            document.getElementById('displayContainer').classList.add('hidden');
            errorContainer.classList.remove('hidden');
        }
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.imageSegmentDisplay) {
        // Refresh display when page becomes visible
        if (window.imageSegmentDisplay.currentImage) {
            window.imageSegmentDisplay.displaySegment();
        }
    }
});