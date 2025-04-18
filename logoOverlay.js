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
        this.controlsContainer = null;
        this.cropperContainer = null;
        this.cropperCanvas = null;
        this.mode = null; // 'move', 'resize', 'rotate'
        this.startX = 0;
        this.startY = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.startRotation = 0;
        this.startMouseX = undefined;
        this.startMouseY = undefined;
        this.isEditing = false;
        this.editingTooltip = null;
        this.highQualityLogo = null;
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
        
        // Configuración para alta calidad
        this.logoImage.decoding = 'sync';
        this.logoImage.setAttribute('draggable', 'false');
        
        // Aplicar estilos para alta calidad
        this.logoImage.style.opacity = this.settings.opacity / 100;
        this.logoImage.style.cursor = 'pointer';
        this.logoImage.style.pointerEvents = 'auto';
        this.logoImage.style.imageRendering = '-webkit-optimize-contrast';
        this.logoImage.style.imageRendering = 'crisp-edges';
        
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
            this.logoImage.style.transformOrigin = 'center center';
            
            // Precarga del logo a máxima calidad para uso futuro
            this.preloadHighQualityLogo(this.logoImage.src);
            
            // Añadir el logo al contenedor del cropper
            this.cropperContainer.appendChild(this.logoImage);
            
            // Crear y añadir controles
            this.createControls();
            
            // Añadir event listener para el logo
            this.logoImage.addEventListener('click', this.toggleControls.bind(this));
            
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

            // Agregar eventos globales para cancelar edición
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
            document.addEventListener('click', this.handleDocumentClick);
        };
        
        // Manejar errores de carga
        this.logoImage.onerror = () => {
            console.error('Error al cargar el logo');
            URL.revokeObjectURL(logoUrl);
            this.removeLogo();
        };
    }
    
    /**
     * Precarga una versión de alta calidad del logo
     * @param {string} src - URL de la imagen del logo
     */
    preloadHighQualityLogo(src) {
        // Eliminar la versión anterior si existe
        if (this.highQualityLogo) {
            this.highQualityLogo.onload = null;
            this.highQualityLogo.onerror = null;
            this.highQualityLogo = null;
        }
        
        // Crear una imagen adicional de alta calidad que nunca se muestra
        // pero estará disponible para el proceso de exportación
        this.highQualityLogo = new Image();
        
        // Agregar manejadores de eventos para asegurar la carga correcta
        this.highQualityLogo.onload = () => {
            console.log("Logo de alta calidad cargado correctamente:", 
                `${this.highQualityLogo.naturalWidth}x${this.highQualityLogo.naturalHeight}`);
        };
        
        this.highQualityLogo.onerror = (e) => {
            console.error("Error al cargar el logo de alta calidad:", e);
            // Si falla, eliminamos la referencia para que se use el logo normal
            this.highQualityLogo = null;
        };
        
        // Configurar para máxima calidad
        this.highQualityLogo.decoding = 'sync';
        this.highQualityLogo.crossOrigin = 'anonymous';
        
        // Configuraciones adicionales para mejorar calidad
        this.highQualityLogo.setAttribute('importance', 'high');
        
        // Establecer el origen después de configurar los manejadores
        this.highQualityLogo.src = src;
    }
    
    /**
     * Crea los controles SVG para manipular el logo
     */
    createControls() {
        // Eliminar controles previos si existen
        if (this.controlsContainer) {
            this.controlsContainer.remove();
        }
        
        // Crear contenedor para los controles
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'logoControls';
        this.controlsContainer.className = 'logo-controls-container';
        this.controlsContainer.style.position = 'absolute';
        this.controlsContainer.style.zIndex = '20';
        this.controlsContainer.style.display = 'none';
        this.controlsContainer.style.flexDirection = 'row';
        this.controlsContainer.style.gap = '5px';
        this.controlsContainer.style.padding = '5px';
        this.controlsContainer.style.borderRadius = '5px';
        this.controlsContainer.style.background = 'rgba(0, 0, 0, 0.6)';
        this.controlsContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';

        // Crear los botones de control
        const moveBtn = this.createControlButton('move', 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122');
        const resizeBtn = this.createControlButton('resize', 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4');
        const rotateBtn = this.createControlButton('rotate', 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15');
        const deleteBtn = this.createControlButton('delete', 'M6 18L18 6M6 6l12 12');
        
        // Añadir botones al contenedor
        this.controlsContainer.appendChild(moveBtn);
        this.controlsContainer.appendChild(resizeBtn);
        this.controlsContainer.appendChild(rotateBtn);
        this.controlsContainer.appendChild(deleteBtn);

        // Añadir el contenedor de controles al cropper
        this.cropperContainer.appendChild(this.controlsContainer);
        
        // Posicionar los controles cerca del logo
        this.updateControlsPosition();
    }

    /**
     * Crea un botón de control con el ícono SVG
     * @param {string} action - Acción del botón (move, resize, rotate, delete)
     * @param {string} svgPath - Path del SVG
     * @returns {HTMLButtonElement} - Botón creado
     */
    createControlButton(action, svgPath) {
        const button = document.createElement('button');
        button.className = 'logo-control-btn';
        button.setAttribute('data-action', action);
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.borderRadius = '50%';
        button.style.background = 'white';
        button.style.border = 'none';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.cursor = 'pointer';
        button.style.padding = '0';
        button.style.margin = '0';
        button.style.transition = 'transform 0.2s, background-color 0.2s';

        // Crear el icono SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.style.color = '#1f2937';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('d', svgPath);

        svg.appendChild(path);
        button.appendChild(svg);

        // Color específico para el botón de eliminar
        if (action === 'delete') {
            button.style.background = '#ef4444';
            svg.style.color = 'white';
        }

        // Agregar evento para hover
        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.1)';
            if (action !== 'delete') {
                button.style.backgroundColor = '#10b981';
                svg.style.color = 'white';
            } else {
                button.style.backgroundColor = '#dc2626';
            }
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
            if (action !== 'delete') {
                button.style.backgroundColor = 'white';
                svg.style.color = '#1f2937';
            } else {
                button.style.backgroundColor = '#ef4444';
            }
        });

        // Agregar una variable para rastrear si estamos terminando una edición
        let wasEditing = false;

        // Capturar el estado de edición en mousedown
        button.addEventListener('mousedown', () => {
            wasEditing = this.isEditing;
        });

        // Agregar eventos para las acciones - cambiado de mousedown a click
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Verificar si estamos terminando una edición
            if (wasEditing) {
                // Si estábamos editando, el click solo debe terminar la edición
                // y no iniciar una nueva inmediatamente
                wasEditing = false;
                return;
            }
            
            switch (action) {
                case 'move':
                    this.startMove(true); // Pasar true para indicar que viene de un botón
                    break;
                case 'resize':
                    this.startResize(true); // Pasar true para indicar que viene de un botón
                    break;
                case 'rotate':
                    this.startRotate(true); // Pasar true para indicar que viene de un botón
                    break;
                case 'delete':
                    this.removeLogo();
                    break;
            }
        });
        
        return button;
    }
    
    /**
     * Actualiza la posición de los controles para que estén cerca del logo
     */
    updateControlsPosition() {
        if (!this.logoImage || !this.controlsContainer) return;
        
        const rect = this.logoImage.getBoundingClientRect();
        const containerRect = this.cropperContainer.getBoundingClientRect();

        // Posicionar sobre el logo con más margen para evitar clicks accidentales
        const top = this.settings.y - this.controlsContainer.offsetHeight - 15; // Aumentado de 10 a 15px
        const left = this.settings.x + (this.settings.width / 2) - (this.controlsContainer.offsetWidth / 2);

        // Asegurarse de que no se salga del contenedor
        const adjustedLeft = Math.max(5, Math.min(left, containerRect.width - this.controlsContainer.offsetWidth - 5));
        const adjustedTop = Math.max(5, top);

        this.controlsContainer.style.left = `${adjustedLeft}px`;
        this.controlsContainer.style.top = `${adjustedTop}px`;
    }

    /**
     * Muestra u oculta los controles del logo
     */
    toggleControls() {
        if (!this.controlsContainer) return;

        if (this.controlsContainer.style.display === 'none' || !this.controlsContainer.style.display) {
            this.controlsContainer.style.display = 'flex';
            this.updateControlsPosition();
        } else {
            this.controlsContainer.style.display = 'none';
        }
    }
    
    /**
     * Remueve el logo del cropper
     */
    removeLogo() {
        // Eliminar controles si existen
        if (this.controlsContainer) {
            this.controlsContainer.remove();
            this.controlsContainer = null;
        }
        
        if (this.logoImage) {
            // Revocar URL del objeto antes de eliminar
            if (this.settings.url) {
                URL.revokeObjectURL(this.settings.url);
            }
            
            // Eliminar elemento del DOM
            this.logoImage.remove();
            this.logoImage = null;
            
            // Limpiar imagen de alta calidad
            this.highQualityLogo = null;
            
            // Resetear settings
            this.settings.visible = false;
            this.settings.url = null;
        }
        
        // Eliminar event listeners globales
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.handleDocumentClick);
    }

    /**
     * Maneja eventos de teclado para cancelar la edición
     * @param {KeyboardEvent} e - Evento de teclado
     */
    handleKeyDown(e) {
        if (this.isEditing && (e.key === 'Escape' || e.key === 'Enter')) {
            this.stopEditing();
        }
    }

    /**
     * Detiene cualquier modo de edición activo
     */
    stopEditing() {
        // Eliminar notificación de edición
        this.removeEditingTooltip();
        
        // Eliminar clases de modo y listeners
        if (this.logoImage) {
            this.logoImage.classList.remove('draggable', 'resizing', 'rotating');
        }
        
        // Resetear modo
        this.mode = null;
        this.isEditing = false;
        
        // Resetear coordenadas iniciales
        this.startMouseX = undefined;
        this.startMouseY = undefined;
        
        // Eliminar listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousedown', this.handleMouseDown);
        
        // Mostrar controles nuevamente
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'flex';
            this.updateControlsPosition();
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

        // Ocultar controles si el logo no es visible
        if (!visible && this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
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
     * Muestra una notificación de edición activa
     * @param {string} mode - El modo de edición actual
     */
    showEditingMode(mode) {
        // Eliminar notificación existente si la hay
        this.removeEditingTooltip();
        
        // Crear contenedor para la notificación
        this.editingTooltip = document.createElement('div');
        this.editingTooltip.id = 'editingTooltip';
        this.editingTooltip.className = 'editing-tooltip';
        
        // Texto según el modo
        let modeText = '';
        switch (mode) {
            case 'move':
                modeText = 'Moving logo';
                break;
            case 'resize':
                modeText = 'Resizing logo';
                break;
            case 'rotate':
                modeText = 'Rotating logo';
                break;
        }
        
        // Configurar contenido y estilos
        this.editingTooltip.innerHTML = `
            <span class="mode">${modeText}</span>
            <span class="key-hint">Press ESC, ENTER or left-click to finish</span>
        `;
        
        // Añadir al body
        document.body.appendChild(this.editingTooltip);
        
        // Animación de entrada
        setTimeout(() => {
            this.editingTooltip.classList.add('visible');
        }, 10);
    }

    /**
     * Elimina la notificación de edición
     */
    removeEditingTooltip() {
        if (this.editingTooltip) {
            this.editingTooltip.classList.remove('visible');
            setTimeout(() => {
                if (this.editingTooltip && this.editingTooltip.parentNode) {
                    this.editingTooltip.parentNode.removeChild(this.editingTooltip);
                }
                this.editingTooltip = null;
            }, 300); // Tiempo para la animación
        }
    }
    
    /**
     * Inicia el modo de mover el logo
     * @param {boolean} fromButton - Indica si la acción viene de un botón
     */
    startMove(fromButton = false) {
        if (!this.logoImage) return;
        
        // Si ya estamos en modo de edición, detener primero
        if (this.isEditing) {
            this.stopEditing();
        }
        
        this.mode = 'move';
        this.isEditing = true;
        this.logoImage.classList.add('draggable');
        
        // Ocultar controles durante la edición
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
        }
        
        // Mostrar notificación de edición
        this.showEditingMode('move');
        
        // Almacenar posición inicial
        this.startX = this.settings.x;
        this.startY = this.settings.y;
        
        // Añadir listeners de eventos
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Si viene de un botón, capturar la posición actual del mouse
        if (fromButton) {
            const handleInitialMove = (e) => {
                this.startMouseX = e.clientX;
                this.startMouseY = e.clientY;
                
                // Solo necesitamos este evento una vez
                document.removeEventListener('mousemove', handleInitialMove);
            };
            
            document.addEventListener('mousemove', handleInitialMove, { once: true });
        } else {
            // Capturar posición inicial del ratón
            document.addEventListener('mousedown', this.handleMouseDown);
        }
    }
    
    /**
     * Inicia el modo de redimensionar el logo
     * @param {boolean} fromButton - Indica si la acción viene de un botón
     */
    startResize(fromButton = false) {
        if (!this.logoImage) return;
        
        // Si ya estamos en modo de edición, detener primero
        if (this.isEditing) {
            this.stopEditing();
        }
        
        this.mode = 'resize';
        this.isEditing = true;
        this.logoImage.classList.add('resizing');
        
        // Ocultar controles durante la edición
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
        }
        
        // Mostrar notificación de edición
        this.showEditingMode('resize');
        
        // Almacenar dimensiones iniciales
        this.startWidth = this.settings.width;
        this.startHeight = this.settings.height;
        
        // Añadir listeners de eventos
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Si viene de un botón, capturar la posición actual del mouse
        if (fromButton) {
            const handleInitialMove = (e) => {
                this.startMouseX = e.clientX;
                this.startMouseY = e.clientY;
                
                // Solo necesitamos este evento una vez
                document.removeEventListener('mousemove', handleInitialMove);
            };
            
            document.addEventListener('mousemove', handleInitialMove, { once: true });
        } else {
            // Capturar posición inicial del ratón
            document.addEventListener('mousedown', this.handleMouseDown);
        }
    }
    
    /**
     * Inicia el modo de rotar el logo
     * @param {boolean} fromButton - Indica si la acción viene de un botón
     */
    startRotate(fromButton = false) {
        if (!this.logoImage) return;
        
        // Si ya estamos en modo de edición, detener primero
        if (this.isEditing) {
            this.stopEditing();
        }
        
        this.mode = 'rotate';
        this.isEditing = true;
        this.logoImage.classList.add('rotating');
        
        // Ocultar controles durante la edición
        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'none';
        }
        
        // Mostrar notificación de edición
        this.showEditingMode('rotate');
        
        // Almacenar rotación inicial
        this.startRotation = this.settings.rotation;
        
        // Calcular centro del logo para rotación
        const rect = this.logoImage.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        
        // Añadir listeners de eventos
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        // Si viene de un botón, capturar la posición actual del mouse
        if (fromButton) {
            const handleInitialMove = (e) => {
                this.startMouseX = e.clientX;
                this.startMouseY = e.clientY;
                
                // Solo necesitamos este evento una vez
                document.removeEventListener('mousemove', handleInitialMove);
            };
            
            document.addEventListener('mousemove', handleInitialMove, { once: true });
        } else {
            // Capturar posición inicial del ratón
            document.addEventListener('mousedown', this.handleMouseDown);
        }
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
        if (!this.logoImage || !this.mode || !this.isEditing) return;
        
        // Si no tenemos coordenadas iniciales del mouse, las establecemos
        if (this.startMouseX === undefined || this.startMouseY === undefined) {
            this.startMouseX = e.clientX;
            this.startMouseY = e.clientY;
            return;
        }
        
        const dx = e.clientX - this.startMouseX;
        const dy = e.clientY - this.startMouseY;
        
        switch (this.mode) {
            case 'move':
                // Actualizar posición
                const newX = this.startX + dx;
                const newY = this.startY + dy;
                
                // Limitar dentro del cropbox
                const containerRect = this.cropperContainer.getBoundingClientRect();
                const minX = 0;
                const minY = 0;
                const maxX = containerRect.width - this.settings.width;
                const maxY = containerRect.height - this.settings.height;
                
                this.settings.x = Math.max(minX, Math.min(newX, maxX));
                this.settings.y = Math.max(minY, Math.min(newY, maxY));
                
                this.logoImage.style.left = `${this.settings.x}px`;
                this.logoImage.style.top = `${this.settings.y}px`;
                break;
                
            case 'resize':
                // Factor de escala basado en la distancia desde el centro
                const scaleFactor = 1 + Math.max(dx, dy) / 200;
                
                // Calcular nuevas dimensiones preservando proporción
                const newWidth = this.startWidth * scaleFactor;
                const newHeight = this.startHeight * scaleFactor;
                
                // Establecer tamaño mínimo
                const minSize = 20;
                
                // Actualizar dimensiones si son mayores que el mínimo
                if (newWidth >= minSize && newHeight >= minSize) {
                    this.settings.width = newWidth;
                    this.settings.height = newHeight;
                    
                    this.logoImage.style.width = `${newWidth}px`;
                    this.logoImage.style.height = `${newHeight}px`;
                }
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

        // Actualizar la posición de los controles si están visibles
        if (this.controlsContainer && this.controlsContainer.style.display !== 'none') {
            this.updateControlsPosition();
        }
    }
    
    /**
     * Maneja el evento mouseup
     */
    handleMouseUp = (e) => {
        // Si es click izquierdo (button=0), detener la edición
        if (e.button === 0) {
            // Guardamos el estado actual para evitar reinicios inmediatos
            const wasEditing = this.isEditing;
            const currentMode = this.mode;
            
            this.stopEditing();
            
            // Prevenimos que se reinicie la misma edición inmediatamente
            // si el click fue sobre un botón de control
            if (wasEditing) {
                // Verificar si el click fue sobre un botón de control
                const buttons = document.querySelectorAll('.logo-control-btn');
                for (const button of buttons) {
                    if (e.target === button || button.contains(e.target)) {
                        // Detenemos la propagación para evitar que el click inicie una nueva edición
                        e.stopPropagation();
                        e.preventDefault();
                        return;
                    }
                }
            }
        }
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

        // Actualizar posición de los controles si están visibles
        if (this.controlsContainer && this.controlsContainer.style.display !== 'none') {
            this.updateControlsPosition();
        }
    }

    /**
     * Maneja clics en el documento para cancelar la edición
     * @param {MouseEvent} e - Evento de clic
     */
    handleDocumentClick = (e) => {
        // Si estamos editando y el clic no es en el logo o en los controles
        if (this.isEditing) {
            // Verificar si el clic fue en el logo o en los controles
            let targetIsRelated = false;
            
            // Verificar el logo
            if (this.logoImage && (e.target === this.logoImage || this.logoImage.contains(e.target))) {
                targetIsRelated = true;
            }
            
            // Verificar los controles
            if (this.controlsContainer && (e.target === this.controlsContainer || this.controlsContainer.contains(e.target))) {
                targetIsRelated = true;
            }
            
            // Si el clic fue fuera del logo y los controles, detener la edición
            if (!targetIsRelated) {
                // Guardamos el estado actual
                const wasEditing = this.isEditing;
                
                this.stopEditing();
                
                // Prevenimos cualquier inicio inmediato de edición
                if (wasEditing) {
                    e.stopPropagation();
                    
                    // Añadir una pequeña protección contra doble click
                    const buttons = document.querySelectorAll('.logo-control-btn');
                    buttons.forEach(button => {
                        // Desactivar temporalmente los botones
                        button.style.pointerEvents = 'none';
                        
                        // Reactivar después de un breve retraso
                        setTimeout(() => {
                            button.style.pointerEvents = 'auto';
                        }, 100);
                    });
                }
            }
        }
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
    const logoOpacitySlider = document.getElementById('logoOpacity');
    const logoActiveStatus = document.getElementById('logoActiveStatus');
    
    // Toggle de visibilidad del logo (ahora maneja el checkbox oculto)
    if (showLogoCheckbox) {
        showLogoCheckbox.addEventListener('change', function() {
            // Mostrar/ocultar controles (ya no es necesario)
            // Actualizar visibilidad del logo
            logoOverlay.updateVisibility(this.checked);
            
            // Actualizar el badge de estado activo
            if (logoActiveStatus) {
                logoActiveStatus.classList.toggle('hidden', !this.checked);
            }
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
                    // Asegurar que el checkbox esté marcado antes de crear el logo
                    if (showLogoCheckbox && !showLogoCheckbox.checked) {
                        showLogoCheckbox.checked = true;
                        // Disparar el evento change para actualizar la visibilidad
                        const event = new Event('change');
                        showLogoCheckbox.dispatchEvent(event);
                    }
                    
                    await logoOverlay.createLogo(cropper, file);
                    
                    // Mostrar el indicador de activo
                    if (logoActiveStatus) {
                        logoActiveStatus.classList.remove('hidden');
                    }
                }
            }
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