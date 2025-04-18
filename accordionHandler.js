/**
 * Maneja el comportamiento de acordeón para los menús desplegables en el sidebar
 */
export function initAccordion() {
    // Seleccionar todos los headers de acordeón
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    // Añadir event listener a cada header
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            // Toggle la clase active en el header actual
            this.classList.toggle('active');
            
            // Obtener el ID del contenido desde el atributo data-accordion
            const contentId = this.getAttribute('data-accordion') + '-content';
            const content = document.getElementById(contentId);
            
            // Si no existe el contenido, salir
            if (!content) return;
            
            // Toggle la clase open en el contenido
            if (content.classList.contains('open')) {
                // Cerrar este acordeón
                content.classList.remove('open');
            } else {
                // Cerrar todos los demás acordeones primero
                document.querySelectorAll('.accordion-content').forEach(item => {
                    if (item !== content && item.classList.contains('open')) {
                        item.classList.remove('open');
                        // Encontrar y desactivar el header correspondiente
                        const accordionId = item.id.replace('-content', '');
                        const header = document.querySelector(`.accordion-header[data-accordion="${accordionId}"]`);
                        if (header && header.classList.contains('active')) {
                            header.classList.remove('active');
                        }
                    }
                });
                
                // Abrir este acordeón
                content.classList.add('open');
            }
        });
    });
    
    // Inicializa el manejo del logo overlay
    initLogoOverlayHandling();
}

/**
 * Inicializa el manejo especial para la sección de logo overlay
 */
function initLogoOverlayHandling() {
    const logoSection = document.querySelector('[data-accordion="logoOverlay"]');
    const logoContent = document.getElementById('logoOverlay-content');
    const uploadLogoBtn = document.getElementById('uploadLogoBtn');
    const showLogoCheckbox = document.getElementById('showLogoOverlay');
    const logoActiveStatus = document.getElementById('logoActiveStatus');
    
    if (!logoSection || !uploadLogoBtn || !showLogoCheckbox || !logoContent || !logoActiveStatus) return;
    
    // Cuando se hace clic en el botón de subir logo
    uploadLogoBtn.addEventListener('click', () => {
        // Marcar el checkbox como checked si no lo está
        if (!showLogoCheckbox.checked) {
            showLogoCheckbox.checked = true;
            // Mostrar indicador de logo activo
            logoActiveStatus.classList.remove('hidden');
        }
    });
    
    // Crear un MutationObserver para detectar cambios en el logoControls
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const logoControls = document.getElementById('logoControls');
                // Si logoControls ya no está oculto, entonces tenemos un logo activo
                if (logoControls && !logoControls.classList.contains('hidden')) {
                    logoActiveStatus.classList.remove('hidden');
                } else {
                    logoActiveStatus.classList.add('hidden');
                }
            }
        });
    });
    
    // Observar cambios en logoControls
    const logoControls = document.getElementById('logoControls');
    if (logoControls) {
        observer.observe(logoControls, { attributes: true });
    }
    
    // Cuando el checkbox cambia (a través de código), actualizar el indicador de estado
    showLogoCheckbox.addEventListener('change', function() {
        if (this.checked) {
            logoActiveStatus.classList.remove('hidden');
            // Asegurar que el acordeón esté abierto cuando se activa el logo
            if (!logoContent.classList.contains('open')) {
                logoSection.click();
            }
        } else {
            logoActiveStatus.classList.add('hidden');
        }
    });
}

/**
 * Actualiza los controles de UI basado en el estado actual
 * @param {Object} state - Estado de las opciones
 */
export function updateUIFromState(state) {
    // Actualizar toggles
    if (document.getElementById('showGridGuides')) {
        document.getElementById('showGridGuides').checked = state.showGridGuides;
    }
    
    if (document.getElementById('showLoginBox')) {
        document.getElementById('showLoginBox').checked = state.showLoginBox;
    }
    
    // Actualizar logo overlay
    if (document.getElementById('showLogoOverlay')) {
        document.getElementById('showLogoOverlay').checked = state.showLogoOverlay;
        
        // Actualizar visibilidad de controles e indicador
        const logoControls = document.getElementById('logoControls');
        const logoActiveStatus = document.getElementById('logoActiveStatus');
        
        if (logoControls) {
            logoControls.classList.toggle('hidden', !state.showLogoOverlay);
        }
        
        if (logoActiveStatus) {
            logoActiveStatus.classList.toggle('hidden', !state.showLogoOverlay);
        }
    }
    
    // Actualizar sliders de ajustes de imagen
    if (document.getElementById('brightness')) {
        document.getElementById('brightness').value = state.imageAdjustments.brightness;
    }
    
    if (document.getElementById('contrast')) {
        document.getElementById('contrast').value = state.imageAdjustments.contrast;
    }
    
    if (document.getElementById('saturation')) {
        document.getElementById('saturation').value = state.imageAdjustments.saturation;
    }
    
    if (document.getElementById('vibrance')) {
        document.getElementById('vibrance').value = state.imageAdjustments.vibrance;
    }
    
    // Actualizar select de preset LUT
    if (document.getElementById('lutPreset')) {
        document.getElementById('lutPreset').value = state.imageAdjustments.lutPreset;
    }
    
    // Actualizar slider de opacidad de logo
    if (document.getElementById('logoOpacity')) {
        document.getElementById('logoOpacity').value = state.logoSettings.opacity;
    }
} 