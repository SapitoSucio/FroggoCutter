/**
 * Clase para manejar las guías de cuadrícula
 */
class GridGuides {
    constructor() {
        this.visible = true;
        this.guideCanvas = null;
    }
    
    /**
     * Actualiza la visibilidad de las guías
     * @param {boolean} visible - Si las guías deben estar visibles
     */
    updateVisibility(visible) {
        this.visible = visible;
        
        // Actualizar el canvas de guías si existe
        if (this.guideCanvas) {
            this.guideCanvas.style.opacity = visible ? '1' : '0';
        }
    }
    
    /**
     * Referencia al canvas de guías existente
     * @param {HTMLCanvasElement} canvas - El canvas de guías
     */
    setGuideCanvas(canvas) {
        this.guideCanvas = canvas;
        this.updateVisibility(this.visible);
    }
}

// Exportar una instancia única
const gridGuides = new GridGuides();
export default gridGuides;

/**
 * Inicializa los eventos para controlar las guías de cuadrícula
 */
export function initGridGuides() {
    // Obtener el checkbox de las guías
    const showGridGuidesCheckbox = document.getElementById('showGridGuides');
    
    if (showGridGuidesCheckbox) {
        // Inicializar con el valor del checkbox
        gridGuides.updateVisibility(showGridGuidesCheckbox.checked);
        
        // Añadir event listener para cambios
        showGridGuidesCheckbox.addEventListener('change', function() {
            gridGuides.updateVisibility(this.checked);
        });
    }
    
    // Modificar la función drawCustomGuides existente para respetar la visibilidad
    patchDrawCustomGuides();
}

/**
 * Modifica la función drawCustomGuides global para respetar la visibilidad de las guías
 */
function patchDrawCustomGuides() {
    // Guardar referencia a la función original
    if (typeof window.drawCustomGuides === 'function') {
        const originalDrawCustomGuides = window.drawCustomGuides;
        
        // Reemplazar con nuestra versión que respeta la visibilidad
        window.drawCustomGuides = function() {
            // Llamar a la función original
            originalDrawCustomGuides.apply(this, arguments);
            
            // Obtener el canvas de guías después de que la función original lo cree
            const guideCanvas = document.getElementById('guideCanvas');
            
            // Si existe el canvas, actualizamos su referencia y aplicamos visibilidad
            if (guideCanvas) {
                gridGuides.setGuideCanvas(guideCanvas);
            }
        };
    }
} 