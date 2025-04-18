/**
 * Maneja el comportamiento de acordeón para los menús desplegables en el sidebar
 */
export function initAccordion() {
    // Seleccionar todos los botones con la clase accordion-btn
    const accordionButtons = document.querySelectorAll('.accordion-btn');
    
    // Añadir event listener a cada botón
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle la clase active en el botón actual
            this.classList.toggle('active');
            
            // Encontrar el contenido asociado (siguiente elemento hermano con clase accordion-content)
            const content = this.nextElementSibling;
            
            // Toggle la clase hidden en el contenido
            if (content.classList.contains('hidden')) {
                // Cerrar todos los demás acordeones primero
                document.querySelectorAll('.accordion-content').forEach(item => {
                    if (item !== content && !item.classList.contains('hidden')) {
                        item.classList.add('hidden');
                        // Encontrar y desactivar el botón correspondiente
                        const parentButton = item.previousElementSibling;
                        if (parentButton && parentButton.classList.contains('active')) {
                            parentButton.classList.remove('active');
                        }
                    }
                });
                
                // Abrir este acordeón
                content.classList.remove('hidden');
            } else {
                // Cerrar este acordeón
                content.classList.add('hidden');
            }
        });
    });
}

/**
 * Actualiza los controles de UI basado en el estado actual
 * @param {Object} state - Estado de las opciones
 */
export function updateUIFromState(state) {
    // Actualizar checkboxes
    if (document.getElementById('showGridGuides')) {
        document.getElementById('showGridGuides').checked = state.showGridGuides;
    }
    
    if (document.getElementById('showLogoOverlay')) {
        document.getElementById('showLogoOverlay').checked = state.showLogoOverlay;
        // Actualizar visibilidad de controles de logo
        const logoControls = document.getElementById('logoControls');
        if (logoControls) {
            logoControls.classList.toggle('hidden', !state.showLogoOverlay);
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