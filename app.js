// Image Segment Display System
class ImageSegmentDisplay {
    constructor() {
        this.params = this.parseURLParams();
        this.supportedFormats = ['png', 'jpeg', 'jpg', 'gif'];
        this.maxGridSize = { rows: 10, cols: 10 };
        
        // Sample images data (since no actual images were provided)
        this.sampleImages = {
            '1.jpeg': this.createSampleImage(800, 600, ['#1FB8CD', '#FFC185', '#B4413C']),
            '2.png': this.createSampleImage(800, 600, ['#5D878F', '#ECEBD5', '#DB4545']),
            '3.jpeg': this.createSampleImage(800, 600, ['#D2BA4C', '#964325', '#944454'])
        };
        
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

    createSampleImage(width, height, colors) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add some geometric patterns
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 50 + 10;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add grid lines for reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < height; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Add text overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText('SAMPLE IMAGE', width/2, height/2 - 20);
        
        ctx.font = '16px Arial';
        ctx.fillText(`${width}x${height}`, width/2, height/2 + 20);
        
        return canvas.toDataURL('image/jpeg', 0.8);
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
                error: 'Invalid gridSize format. Use format like "4x3" (columns x rows).'
            };
        }
        
        const cols = parseInt(gridMatch[1]);
        const rows = parseInt(gridMatch[2]);
        
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
        
        // Check if image exists in sample images
        if (this.sampleImages[this.params.imageName]) {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.processImage();
            };
            img.onerror = () => {
                this.showError(`Failed to load image: ${this.params.imageName}`);
            };
            img.src = this.sampleImages[this.params.imageName];
        } else {
            // Try to load from assets (in case images are actually provided)
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.processImage();
            };
            img.onerror = () => {
                this.showError(`Image not found: ${this.params.imageName}. Available images: ${Object.keys(this.sampleImages).join(', ')}`);
            };
            img.src = this.params.imageName;
        }
    }

    processImage() {
        try {
            const gridMatch = this.params.gridSize.match(/^(\d+)x(\d+)$/);
            const cols = parseInt(gridMatch[1]);
            const rows = parseInt(gridMatch[2]);
            
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

// Sample image creation utility
function createImageBlob(width, height, colors) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Create colorful pattern
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 0; x < width; x += 50) {
        for (let y = 0; y < height; y += 50) {
            if ((x + y) % 100 === 0) {
                ctx.fillRect(x, y, 25, 25);
            }
        }
    }
    
    return canvas;
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