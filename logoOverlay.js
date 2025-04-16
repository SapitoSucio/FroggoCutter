/**
 * Clase para manejar el overlay de logo
 */
class LogoOverlay {
    constructor() {
        this.settings = {
            visible: false,
            opacity: 100,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0,
            url: null
        };
        
        this.logoImage = null;
        this.cropperContainer = null;
        this.cropperCanvas = null;
        this.mode = null; // 'move', 'resize', 'rotate'
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startRotation = 0;
        this.startMouseX = 0;
        this.startMouseY = 0;
    }
    
    /**
     * Crea e inicializa el elemento de logo
     * @param {Cropper} cropper - Instancia del cropper
     * @param {File} logoFile - Archivo de imagen del logo
     */
    async createLogo(cropper, logoFile) {
        if (!cropper || !cropper.ready) return;
        
        // Encontrar el contenedor del cropper
        this.cropperContainer = document.querySelector('.cropper-container');
        if (!this.cropperContainer) return;
        
        // Encontrar el canvas del cropper
        this.cropperCanvas = this.cropperContainer.querySelector('.cropper-canvas');
        if (!this.cropperCanvas) return;
        
        // Eliminar logo existente si lo hay
        this.removeLogo();
        
        // Crear URL para el archivo de logo
        const logoUrl = URL.createObjectURL(logoFile);
        
        // Crear y configurar elemento de imagen para el logo
        this.logoImage = document.createElement('img');
        this.logoImage.id = 'logoOverlay';
        this.logoImage.src = logoUrl;
        this.logoImage.alt = 'Logo Overlay';
        this.logoImage.style.opacity = this.settings.opacity / 100;
        this.logoImage.style.pointerEvents = 'none';
        
        // Inicialmente oculto hasta que cargue
        this.logoImage.style.opacity = '0';
        
        // Manejar la carga de la imagen
        this.logoImage.onload = () => {
            // Obtener dimensiones originales
            const logoWidth = this.logoImage.naturalWidth;
            const logoHeight = this.logoImage.naturalHeight;
            
            // Obtener dimensiones del cropbox
            const cropBoxData = cropper.getCropBoxData();
            const cropBoxWidth = cropBoxData.width;
            const cropBoxHeight = cropBoxData.height;
            
            // Calcular tamaño inicial (ajustar si es muy grande)
            const maxWidth = cropBoxWidth * 0.5;
            const maxHeight = cropBoxHeight * 0.5;
            
            let newWidth = logoWidth;
            let newHeight = logoHeight;
            
            // Escalar si excede alguna dimensión máxima
            if (newWidth > maxWidth || newHeight > maxHeight) {
                const scaleX = maxWidth / newWidth;
                const scaleY = maxHeight / newHeight;
                const scale = Math.min(scaleX, scaleY);
                
                newWidth = logoWidth * scale;
                newHeight = logoHeight * scale;
            }
            
            // Posición inicial (centrado)
            const left = cropBoxData.left + (cropBoxWidth - newWidth) / 2;
            const top = cropBoxData.top + (cropBoxHeight - newHeight) / 2;
            
            // Actualizar settings
            this.settings.url = logoUrl;
            this.settings.width = newWidth;
            this.settings.height = newHeight;
            this.settings.x = left;
            this.settings.y = top;
            this.settings.visible = true;
            
            // Aplicar estilos
            this.logoImage.style.width = `${newWidth}px`;
            this.logoImage.style.height = `${newHeight}px`;
            this.logoImage.style.left = `${left}px`;
            this.logoImage.style.top = `${top}px`;
            this.logoImage.style.opacity = this.settings.opacity / 100;
            this.logoImage.style.transform = `rotate(${this.settings.rotation}deg)`;
            
            // Añadir el logo al contenedor del cropper
            this.cropperContainer.appendChild(this.logoImage);
            
            // Actualizar checkbox en UI
            const showLogoCheckbox = document.getElementById('showLogoOverlay');
            if (showLogoCheckbox) {
                showLogoCheckbox.checked = true;
            }
            
            // Mostrar controles
            const logoControls = document.getElementById('logoControls');
            if (logoControls) {
                logoControls.classList.remove('hidden');
            }
            
            // Actualizar visibilidad (fadeIn)
            setTimeout(() => {
                this.logoImage.style.opacity = this.settings.opacity / 100;
            }, 50);
        };
        
        // Manejar errores de carga
        this.logoImage.onerror = () => {
            console.error('Error al cargar el logo');
            URL.revokeObjectURL(logoUrl);
            this.removeLogo();
        };
    }
    
    /**
     * Remueve el logo del cropper
     */
    removeLogo() {
        if (this.logoImage) {
            // Revocar URL del objeto antes de eliminar
            if (this.settings.url) {
                URL.revokeObjectURL(this.settings.url);
            }
            
            // Eliminar elemento del DOM
            this.logoImage.remove();
            this.logoImage = null;
            
            // Resetear settings
            this.settings.visible = false;
            this.settings.url = null;
        }
    }
    
    /**
     * Actualiza la visibilidad del logo
     * @param {boolean} visible - Si el logo debe estar visible
     */
    updateVisibility(visible) {
        this.settings.visible = visible;
        
        if (this.logoImage) {
            if (visible) {
                this.logoImage.style.display = 'block';
                setTimeout(() => {
                    this.logoImage.style.opacity = this.settings.opacity / 100;
                }, 10);
            } else {
                this.logoImage.style.opacity = '0';
                setTimeout(() => {
                    this.logoImage.style.display = 'none';
                }, 300); // Esperar a que termine la transición
            }
        }
    }
    
    /**
     * Actualiza la opacidad del logo
     * @param {number} opacity - Valor de opacidad (0-100)
     */
    updateOpacity(opacity) {
        this.settings.opacity = opacity;
        
        if (this.logoImage) {
            this.logoImage.style.opacity = opacity / 100;
        }
    }
    
    /**
     * Inicia el modo de mover el logo
     */
    startMove() {
        if (!this.logoImage) return;
        
        this.mode = 'move';
        this.logoImage.classList.add('draggable');
        
        // Almacenar posición inicial
        this.startX = this.settings.x;
        this.startY = this.settings.y;
        
        // Añadir listeners de eventos
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Capturar posición inicial del ratón
        document.addEventListener('mousedown', this.handleMouseDown);
    }
    
    /**
     * Inicia el modo de redimensionar el logo
     */
    startResize() {
        if (!this.logoImage) return;
        
        this.mode = 'resize';
        this.logoImage.classList.add('resizing');
        
        // Almacenar dimensiones iniciales
        this.startWidth = this.settings.width;
        this.startHeight = this.settings.height;
        
        // Añadir listeners de eventos
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Capturar posición inicial del ratón
        document.addEventListener('mousedown', this.handleMouseDown);
    }
    
    /**
     * Inicia el modo de rotar el logo
     */
    startRotate() {
        if (!this.logoImage) return;
        
        this.mode = 'rotate';
        this.logoImage.classList.add('rotating');
        
        // Almacenar rotación inicial
        this.startRotation = this.settings.rotation;
        
        // Calcular centro del logo para rotación
        const rect = this.logoImage.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        
        // Añadir listeners de eventos
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Capturar posición inicial del ratón
        document.addEventListener('mousedown', this.handleMouseDown);
    }
    
    /**
     * Maneja el evento mousedown
     * @param {MouseEvent} e - Evento de ratón
     */
    handleMouseDown = (e) => {
        // Capturar posición inicial del ratón
        this.startMouseX = e.clientX;
        this.startMouseY = e.clientY;
        
        // Eliminar listener después de capturar
        document.removeEventListener('mousedown', this.handleMouseDown);
    }
    
    /**
     * Maneja el evento mousemove
     * @param {MouseEvent} e - Evento de ratón
     */
    handleMouseMove = (e) => {
        if (!this.logoImage || !this.mode) return;
        
        const dx = e.clientX - this.startMouseX;
        const dy = e.clientY - this.startMouseY;
        
        switch (this.mode) {
            case 'move':
                // Actualizar posición
                const newX = this.startX + dx;
                const newY = this.startY + dy;
                
                this.settings.x = newX;
                this.settings.y = newY;
                
                this.logoImage.style.left = `${newX}px`;
                this.logoImage.style.top = `${newY}px`;
                break;
                
            case 'resize':
                // Factor de escala basado en la distancia desde el centro
                const scaleFactor = 1 + Math.max(dx, dy) / 200;
                
                // Calcular nuevas dimensiones preservando proporción
                const newWidth = this.startWidth * scaleFactor;
                const newHeight = this.startHeight * scaleFactor;
                
                // Actualizar dimensiones
                this.settings.width = newWidth;
                this.settings.height = newHeight;
                
                this.logoImage.style.width = `${newWidth}px`;
                this.logoImage.style.height = `${newHeight}px`;
                break;
                
            case 'rotate':
                // Calcular ángulo basado en las posiciones relativas al centro
                const x1 = this.startMouseX - this.centerX;
                const y1 = this.startMouseY - this.centerY;
                const x2 = e.clientX - this.centerX;
                const y2 = e.clientY - this.centerY;
                
                // Calcular el ángulo entre los dos vectores
                const startAngle = Math.atan2(y1, x1) * (180 / Math.PI);
                const currentAngle = Math.atan2(y2, x2) * (180 / Math.PI);
                const rotationDelta = currentAngle - startAngle;
                
                // Actualizar rotación
                const newRotation = this.startRotation + rotationDelta;
                this.settings.rotation = newRotation;
                
                this.logoImage.style.transform = `rotate(${newRotation}deg)`;
                break;
        }
    }
    
    /**
     * Maneja el evento mouseup
     */
    handleMouseUp = () => {
        // Eliminar clases de modo
        if (this.logoImage) {
            this.logoImage.classList.remove('draggable', 'resizing', 'rotating');
        }
        
        // Resetear modo
        this.mode = null;
        
        // Eliminar listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
    
    /**
     * Resetea la posición y tamaño del logo
     * @param {Cropper} cropper - Instancia del cropper
     */
    resetLogo(cropper) {
        if (!this.logoImage || !cropper || !cropper.ready) return;
        
        // Obtener dimensiones del cropbox
        const cropBoxData = cropper.getCropBoxData();
        const cropBoxWidth = cropBoxData.width;
        const cropBoxHeight = cropBoxData.height;
        
        // Obtener dimensiones originales del logo
        const logoWidth = this.logoImage.naturalWidth;
        const logoHeight = this.logoImage.naturalHeight;
        
        // Calcular tamaño (ajustar si es muy grande)
        const maxWidth = cropBoxWidth * 0.5;
        const maxHeight = cropBoxHeight * 0.5;
        
        let newWidth = logoWidth;
        let newHeight = logoHeight;
        
        // Escalar si excede alguna dimensión máxima
        if (newWidth > maxWidth || newHeight > maxHeight) {
            const scaleX = maxWidth / newWidth;
            const scaleY = maxHeight / newHeight;
            const scale = Math.min(scaleX, scaleY);
            
            newWidth = logoWidth * scale;
            newHeight = logoHeight * scale;
        }
        
        // Posición (centrado)
        const left = cropBoxData.left + (cropBoxWidth - newWidth) / 2;
        const top = cropBoxData.top + (cropBoxHeight - newHeight) / 2;
        
        // Actualizar settings
        this.settings.width = newWidth;
        this.settings.height = newHeight;
        this.settings.x = left;
        this.settings.y = top;
        this.settings.rotation = 0;
        
        // Aplicar estilos
        this.logoImage.style.width = `${newWidth}px`;
        this.logoImage.style.height = `${newHeight}px`;
        this.logoImage.style.left = `${left}px`;
        this.logoImage.style.top = `${top}px`;
        this.logoImage.style.transform = 'rotate(0deg)';
    }
}

// Exportar una instancia única
const logoOverlay = new LogoOverlay();
export default logoOverlay;

/**
 * Inicializa los eventos para los controles de logo overlay
 * @param {Cropper} cropper - Instancia del cropper
 */
export function initLogoOverlay(cropper) {
    // Obtener elementos
    const showLogoCheckbox = document.getElementById('showLogoOverlay');
    const logoControls = document.getElementById('logoControls');
    const uploadLogoBtn = document.getElementById('uploadLogoBtn');
    const logoInput = document.getElementById('logoInput');
    const moveLogoBtn = document.getElementById('moveLogo');
    const resizeLogoBtn = document.getElementById('resizeLogo');
    const rotateLogoBtn = document.getElementById('rotateLogo');
    const resetLogoBtn = document.getElementById('resetLogo');
    const logoOpacitySlider = document.getElementById('logoOpacity');
    
    // Toggle de visibilidad del logo
    if (showLogoCheckbox) {
        showLogoCheckbox.addEventListener('change', function() {
            // Mostrar/ocultar controles
            if (logoControls) {
                logoControls.classList.toggle('hidden', !this.checked);
            }
            
            // Actualizar visibilidad del logo
            logoOverlay.updateVisibility(this.checked);
        });
    }
    
    // Cargar logo
    if (uploadLogoBtn && logoInput) {
        uploadLogoBtn.addEventListener('click', () => {
            logoInput.click();
        });
        
        logoInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (file.type.startsWith('image/')) {
                    await logoOverlay.createLogo(cropper, file);
                }
            }
        });
    }
    
    // Controles de manipulación
    if (moveLogoBtn) {
        moveLogoBtn.addEventListener('click', () => {
            logoOverlay.startMove();
        });
    }
    
    if (resizeLogoBtn) {
        resizeLogoBtn.addEventListener('click', () => {
            logoOverlay.startResize();
        });
    }
    
    if (rotateLogoBtn) {
        rotateLogoBtn.addEventListener('click', () => {
            logoOverlay.startRotate();
        });
    }
    
    if (resetLogoBtn) {
        resetLogoBtn.addEventListener('click', () => {
            logoOverlay.resetLogo(cropper);
        });
    }
    
    // Control de opacidad
    if (logoOpacitySlider) {
        logoOpacitySlider.addEventListener('input', () => {
            const opacity = parseInt(logoOpacitySlider.value);
            logoOverlay.updateOpacity(opacity);
        });
    }
} 