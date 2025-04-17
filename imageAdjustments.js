/**
 * Clase para manejar ajustes avanzados de imagen
 */
class ImageAdjuster {
    constructor() {
        this.settings = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            vibrance: 0,
            lutPreset: 'none'
        };
        
        this._cropStartListener = null;
        this._cropEndListener = null;
        
        // Debug mode (siempre activo para diagnosticar problemas)
        this.debug = true;
    }
    
    /**
     * Actualiza los ajustes de la imagen
     * @param {Object} newSettings - Nuevos ajustes a aplicar
     */
    updateSettings(newSettings) {
        if (this.debug) {
            console.log("Actualizando settings:", newSettings);
        }
        Object.assign(this.settings, newSettings);
        return this.settings;
    }
    
    /**
     * Restablece los ajustes a los valores por defecto
     * @returns {Object} Los ajustes por defecto
     */
    resetSettings() {
        this.settings = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            vibrance: 0,
            lutPreset: 'none'
        };
        return this.settings;
    }
    
    removeOverlay() {
        const cropperContainer = document.querySelector('.cropper-container');
        if (!cropperContainer) return;
        const existingOverlay = cropperContainer.querySelector('.image-adjuster-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
            if (this.debug) console.log("Overlay removido");
        }
    }
    
    detachCropListeners(cropper) {
        if (!cropper || !cropper.element) return;
        if (this._cropStartListener) {
            cropper.element.removeEventListener('cropstart', this._cropStartListener);
            this._cropStartListener = null;
            if (this.debug) console.log("Listener de cropstart eliminado");
        }
        if (this._cropEndListener) {
            cropper.element.removeEventListener('cropend', this._cropEndListener);
            this._cropEndListener = null;
            if (this.debug) console.log("Listener de cropend eliminado");
        }
    }
    
    /**
     * Aplica los ajustes a la imagen en el cropper
     * @param {Cropper} cropper - Instancia del cropper
     */
    apply(cropper) {
        if (!cropper || !cropper.ready) {
            if (this.debug) console.log("Cropper no está listo");
            return;
        }

        try {
            // Encontrar elementos relevantes
            const cropperContainer = document.querySelector('.cropper-container');
            const cropperViewBox = document.querySelector('.cropper-view-box');
            const originalImage = cropper.image;

            if (this.debug) {
                console.log("Ejecutando apply() con settings:", this.settings);
            }

            if (!cropperViewBox || !originalImage) {
                if (this.debug) console.log("No se encontraron elementos esenciales del cropper en apply()");
                return;
            }

            // Siempre limpiar estado anterior (filtros CSS, overlay, listeners)
            cropperViewBox.style.filter = 'none';
            this.removeOverlay();
            this.detachCropListeners(cropper); // Detach listeners before deciding next step

            // Si todos los valores son neutros, terminamos aquí (ya limpiamos)
            if (this.isNeutral()) {
                if (this.debug) console.log("apply(): Todos los valores son neutros, estado limpio.");
                return;
            }

            // ENFOQUE 1: Para efectos básicos usamos filtros CSS
            if (this.canUseSimpleCSSFilters()) {
                const filters = this.generateCSSFilters();
                if (this.debug) console.log("apply(): Aplicando filtros CSS simples:", filters);
                cropperViewBox.style.filter = filters;
                // No necesitamos overlay ni listeners para CSS
                return;
            }

            // ENFOQUE 2: Para efectos avanzados (LUTs, vibrance) usamos overlay
            if (this.debug) console.log("apply(): Aplicando efectos avanzados mediante overlay");
            // Pasar el container es importante
            if (cropperContainer) {
                this.applyOverlayEffects(cropper, cropperViewBox, cropperContainer);
            } else {
                if (this.debug) console.error("apply(): No se encontró cropper-container para aplicar overlay");
            }

        } catch (error) {
            console.error('Error en apply():', error);
        }
    }
    
    /**
     * Comprueba si todos los ajustes están en valores neutros
     * @returns {boolean} true si todos los ajustes están en valores neutros
     */
    isNeutral() {
        return this.settings.brightness === 0 &&
               this.settings.contrast === 0 &&
               this.settings.saturation === 0 &&
               this.settings.vibrance === 0 &&
               this.settings.lutPreset === 'none';
    }
    
    /**
     * Comprueba si podemos usar solo filtros CSS simples
     * @returns {boolean} true si podemos usar solo CSS filters
     */
    canUseSimpleCSSFilters() {
        // Si solo tenemos brillo, contraste, saturación (y quizás b&w o sepia simples)
        const { brightness, contrast, saturation, vibrance, lutPreset } = this.settings;
        
        // Si vibrance != 0 o LUT es uno personalizado, necesitamos canvas
        if (vibrance !== 0) return false;
        // Only allow simple LUTs for CSS preview
        if (lutPreset !== 'none' && !['bw', 'sepia'].includes(lutPreset)) return false;
        
        return true;
    }
    
    /**
     * NUEVO MÉTODO! Genera una cadena con todos los filtros CSS, incluyendo aproximaciones para los LUTs avanzados
     * Esto es para diagnóstico y para verificar que al menos el elemento cropper-view-box responde a los cambios
     */
    generateAllCSSFilters() {
        const { brightness, contrast, saturation, vibrance, lutPreset } = this.settings;
        let filters = [];
        
        // Brillo (brightness)
        if (brightness !== 0) {
            const brightnessFactor = 1 + (brightness / 100);
            filters.push(`brightness(${brightnessFactor.toFixed(2)})`);
        }
        
        // Contraste (contrast)
        if (contrast !== 0) {
            const contrastFactor = 1 + (contrast / 100);
            filters.push(`contrast(${contrastFactor.toFixed(2)})`);
        }
        
        // Saturación (saturation)
        if (saturation !== 0) {
            const saturationFactor = 1 + (saturation / 100);
            filters.push(`saturate(${saturationFactor.toFixed(2)})`);
        }
        
        // Para vibrance, usamos una aproximación de saturación si es positivo
        if (vibrance > 0) {
            const vibranceFactor = 1 + (vibrance / 100);
            filters.push(`saturate(${vibranceFactor.toFixed(2)})`);
        }
        
        // APROXIMACIONES CSS para los LUTs avanzados
        if (lutPreset !== 'none') {
            switch (lutPreset) {
                case 'bw':
                    filters.push('grayscale(1)');
                    break;
                case 'sepia':
                    filters.push('sepia(1)');
                    break;
                case 'warm':
                    // Simulación de tonos cálidos con filtros CSS (no es perfecto pero debería ser visible)
                    filters.push('sepia(0.4)');
                    filters.push('saturate(1.5)');
                    filters.push('hue-rotate(-10deg)');
                    if (this.debug) console.log("Aplicando aproximación CSS para LUT 'warm'");
                    break;
                case 'cool':
                    // Simulación de tonos fríos con filtros CSS
                    filters.push('saturate(1.1)');
                    filters.push('hue-rotate(15deg)');
                    filters.push('brightness(1.02)');
                    if (this.debug) console.log("Aplicando aproximación CSS para LUT 'cool'");
                    break;
                case 'vintage':
                    // Simulación de efecto vintage con filtros CSS
                    filters.push('sepia(0.5)');
                    filters.push('contrast(1.1)');
                    filters.push('brightness(0.95)');
                    filters.push('saturate(0.8)');
                    if (this.debug) console.log("Aplicando aproximación CSS para LUT 'vintage'");
                    break;
            }
        }
        
        return filters.join(' ');
    }
    
    /**
     * Genera una cadena de filtros CSS básicos
     * @returns {string} Cadena de filtros CSS
     */
    generateCSSFilters() {
        const { brightness, contrast, saturation, lutPreset } = this.settings;
        
        let filters = [];
        
        // Brillo (brightness)
        if (brightness !== 0) {
            const brightnessFactor = 1 + (brightness / 100);
            filters.push(`brightness(${brightnessFactor.toFixed(2)})`);
        }
        
        // Contraste (contrast)
        if (contrast !== 0) {
            const contrastFactor = 1 + (contrast / 100);
            filters.push(`contrast(${contrastFactor.toFixed(2)})`);
        }
        
        // Saturación (saturation)
        if (saturation !== 0) {
            const saturationFactor = 1 + (saturation / 100);
            filters.push(`saturate(${saturationFactor.toFixed(2)})`);
        }
        
        // Para efectos simples de B&W y Sepia usamos filtros CSS
        if (lutPreset === 'bw') {
            filters.push('grayscale(1)');
        } else if (lutPreset === 'sepia') {
            filters.push('sepia(1)');
        }
        
        return filters.join(' ');
    }
    
    /**
     * Aplica efectos avanzados usando un overlay transparente sobre el area visible
     * y añade listeners para ocultarlo/mostrarlo durante la interacción.
     * @param {Cropper} cropper - Instancia del cropper
     * @param {HTMLElement} viewBox - El elemento .cropper-view-box
     * @param {HTMLElement} container - El elemento .cropper-container (Necesario para encontrar crop-box)
     */
    applyOverlayEffects(cropper, viewBox, container) {
        if (!cropper || !viewBox || !container) return;

        // Encontrar el crop-box
        const cropBox = container.querySelector('.cropper-crop-box');
        if (!cropBox) {
            if (this.debug) console.error("applyOverlayEffects: No se encontró .cropper-crop-box");
            return;
        }

        try {
            if (this.debug) console.log("applyOverlayEffects: Iniciando creación de overlay dentro de crop-box");

            // --- Crear y posicionar overlay --- 
            const viewBoxRect = viewBox.getBoundingClientRect(); // Usamos las dimensiones del view-box

            // Eliminar overlay previo si existe DENTRO del cropBox (más específico)
            const existingOverlay = cropBox.querySelector('.image-adjuster-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            const overlayCanvas = document.createElement('canvas');
            overlayCanvas.width = viewBoxRect.width;
            overlayCanvas.height = viewBoxRect.height;
            overlayCanvas.className = 'image-adjuster-overlay';
            overlayCanvas.style.position = 'absolute';
            overlayCanvas.style.top = '0px'; // Posición relativa al crop-box
            overlayCanvas.style.left = '0px'; // Posición relativa al crop-box
            overlayCanvas.style.width = `${viewBoxRect.width}px`;
            overlayCanvas.style.height = `${viewBoxRect.height}px`;
            // z-index: 2 -> encima del view-box(1), debajo de face(3), line(4), point(5)
            overlayCanvas.style.zIndex = '2'; 
            overlayCanvas.style.pointerEvents = 'none';
            overlayCanvas.style.imageRendering = 'pixelated'; 
            
            const ctx = overlayCanvas.getContext('2d', { willReadFrequently: true });

            // --- Dibujar imagen con ajustes en el overlay --- 
            const croppedCanvas = cropper.getCroppedCanvas({
                width: viewBoxRect.width * window.devicePixelRatio, 
                height: viewBoxRect.height * window.devicePixelRatio,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'medium' 
            });

            if (!croppedCanvas) {
                if (this.debug) console.error("applyOverlayEffects: No se pudo obtener el canvas recortado");
                return;
            }

            ctx.drawImage(croppedCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height);

            let imageData;
            try {
                imageData = ctx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
            } catch (e) {
                if (this.debug) console.error("applyOverlayEffects: Error al obtener ImageData:", e);
                viewBox.style.filter = this.generateAllCSSFilters(); // Fallback a CSS en view-box
                return;
            }

            const modifiedImageData = this.applyAdjustmentsToImageData(imageData, this.settings);
            ctx.putImageData(modifiedImageData, 0, 0);

            // Añadir el canvas overlay AL CROP-BOX
            cropBox.appendChild(overlayCanvas);
            if (this.debug) console.log("applyOverlayEffects: Overlay CREADO y añadido a crop-box");

            // --- Listener Management --- 
            this.detachCropListeners(cropper); 
            const self = this;

            this._cropStartListener = () => {
                if (self.debug) console.log("Event: cropstart - Ocultando overlay");
                overlayCanvas.style.display = 'none'; 
            };

            this._cropEndListener = () => {
                if (self.debug) console.log("Event: cropend - Mostrando y actualizando overlay");
                try {
                    const currentViewBox = document.querySelector('.cropper-view-box'); // Re-obtener por si acaso
                    if (currentViewBox) {
                        const updatedViewBoxRect = currentViewBox.getBoundingClientRect();

                        // Actualizar tamaño del canvas existente (top/left son 0)
                        overlayCanvas.width = updatedViewBoxRect.width;
                        overlayCanvas.height = updatedViewBoxRect.height;
                        overlayCanvas.style.width = `${updatedViewBoxRect.width}px`;
                        overlayCanvas.style.height = `${updatedViewBoxRect.height}px`;

                        // Re-dibujar contenido
                        const newCroppedCanvas = cropper.getCroppedCanvas({
                            width: updatedViewBoxRect.width * window.devicePixelRatio,
                            height: updatedViewBoxRect.height * window.devicePixelRatio,
                            imageSmoothingEnabled: true,
                            imageSmoothingQuality: 'medium'
                        });
                        if(newCroppedCanvas) {
                            const newCtx = overlayCanvas.getContext('2d', { willReadFrequently: true });
                            // Limpiar antes de dibujar para evitar artefactos en tamaños diferentes
                            newCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                            newCtx.drawImage(newCroppedCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height);
                            let newImageData = newCtx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
                            let newModifiedImageData = self.applyAdjustmentsToImageData(newImageData, self.settings);
                            newCtx.putImageData(newModifiedImageData, 0, 0);

                            overlayCanvas.style.display = 'block'; // Mostrar de nuevo
                            if (self.debug) console.log("Event: cropend - Overlay actualizado y mostrado");
                        } else {
                             if (self.debug) console.error("cropend: No se pudo obtener newCroppedCanvas");
                        }
                    } else {
                        if (self.debug) console.error("cropend: No se encontraron viewBox actualizados");
                    }
                } catch(error) {
                     console.error("Error dentro del listener cropend:", error);
                     overlayCanvas.style.display = 'block'; 
                }
            };

            // Attach new listeners
            cropper.element.addEventListener('cropstart', this._cropStartListener);
            cropper.element.addEventListener('cropend', this._cropEndListener);
            if (this.debug) console.log("applyOverlayEffects: Listeners de cropstart/cropend añadidos");

        } catch (error) {
            console.error("Error en applyOverlayEffects:", error);
            viewBox.style.filter = this.generateAllCSSFilters(); // Fallback
        }
    }
    
    /**
     * Aplica todos los ajustes configurados directamente a un objeto ImageData.
     * @param {ImageData} imageData - El objeto ImageData a modificar.
     * @param {Object} settings - Los ajustes a aplicar (this.settings).
     * @returns {ImageData} El objeto ImageData modificado.
     */
    applyAdjustmentsToImageData(imageData, settings) {
        if (this.debug) console.log("applyAdjustmentsToImageData: Iniciando con settings:", settings);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const { brightness, contrast, saturation, vibrance, lutPreset } = settings;

        // Pre-calculate factors for performance
        const brightnessFactor = brightness / 100.0; // Range -1 to 1
        const contrastFactor = contrast / 100.0; // Range -1 to 1
        const saturationFactor = saturation / 100.0; // Range -1 to 1
        const vibranceFactor = vibrance / 100.0; // Range -1 to 1

        // Contrast calculation: Adjust pixel based on distance from average (127)
        // factor = (1 + contrastFactor) -> range 0 to 2
        // newValue = factor * (oldValue - 127) + 127
        const contrastAdjust = (1 + contrastFactor);

        try {
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // 1. Brillo
                if (brightnessFactor !== 0) {
                    r = Math.max(0, Math.min(255, r + brightnessFactor * 255));
                    g = Math.max(0, Math.min(255, g + brightnessFactor * 255));
                    b = Math.max(0, Math.min(255, b + brightnessFactor * 255));
                }

                // 2. Contraste
                if (contrastFactor !== 0) {
                    r = Math.max(0, Math.min(255, contrastAdjust * (r - 127) + 127));
                    g = Math.max(0, Math.min(255, contrastAdjust * (g - 127) + 127));
                    b = Math.max(0, Math.min(255, contrastAdjust * (b - 127) + 127));
                }

                // 3. Saturación y Vibrance (trabajan en HSL)
                if (saturationFactor !== 0 || vibranceFactor !== 0) {
                    let [h, s, l] = this.rgbToHsl(r / 255, g / 255, b / 255); // Convert to HSL [0, 1] range

                    // Apply Saturation
                    if (saturationFactor !== 0) {
                        s = Math.max(0, Math.min(1, s * (1 + saturationFactor)));
                    }

                    // Apply Vibrance (boost saturation of less saturated colors more)
                    if (vibranceFactor !== 0) {
                        // Calculate boost based on current saturation (less saturated gets more boost)
                        const boost = Math.abs(vibranceFactor) * (1 - s);
                        if (vibranceFactor > 0) {
                            s += boost;
                        } else {
                            s -= boost; // Desaturate less saturated colors less
                        }
                        s = Math.max(0, Math.min(1, s));
                    }

                    // Convert back to RGB [0, 1] range
                    let [newR, newG, newB] = this.hslToRgb(h, s, l);
                    r = newR * 255;
                    g = newG * 255;
                    b = newB * 255;
                }

                // 4. LUT Presets (aplicar después de otros ajustes)
                if (lutPreset !== 'none') {
                     // Aplicar LUTs aquí. Por ahora, implementemos B&W y Sepia
                     switch (lutPreset) {
                         case 'bw':
                             const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                             r = g = b = gray;
                             break;
                         case 'sepia':
                             const sr = 0.393 * r + 0.769 * g + 0.189 * b;
                             const sg = 0.349 * r + 0.686 * g + 0.168 * b;
                             const sb = 0.272 * r + 0.534 * g + 0.131 * b;
                             r = Math.min(255, sr);
                             g = Math.min(255, sg);
                             b = Math.min(255, sb);
                             break;
                         // TODO: Implement 'warm', 'cool', 'vintage' - requires more complex logic or lookup tables
                         case 'warm':
                             // Simple approximation: increase red, decrease blue slightly
                             r = Math.min(255, r * 1.1);
                             b = b * 0.9;
                             break;
                         case 'cool':
                             // Simple approximation: increase blue, decrease red slightly
                             b = Math.min(255, b * 1.1);
                             r = r * 0.9;
                             break;
                         case 'vintage':
                            // Simple sepia + contrast/brightness shift approximation
                            const vr = 0.393 * r + 0.769 * g + 0.189 * b;
                            const vg = 0.349 * r + 0.686 * g + 0.168 * b;
                            const vb = 0.272 * r + 0.534 * g + 0.131 * b;
                            r = Math.max(0, Math.min(255, (1.1 * (vr - 127) + 127) * 0.95)); // contrast + brightness
                            g = Math.max(0, Math.min(255, (1.1 * (vg - 127) + 127) * 0.95));
                            b = Math.max(0, Math.min(255, (1.1 * (vb - 127) + 127) * 0.95));
                            break;
                     }
                }


                // Clamp results just in case and assign back
                data[i] = Math.max(0, Math.min(255, Math.round(r)));
                data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
                data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
                // data[i + 3] remains unchanged (alpha)
            }
             if (this.debug) console.log("applyAdjustmentsToImageData: Procesamiento de píxeles completado.");
             return imageData; // Return modified ImageData
        } catch (error) {
            console.error("Error during pixel processing in applyAdjustmentsToImageData:", error);
            return imageData; // Return original data on error
        }
    }
    
    // Métodos de conversión de color que podrían ser necesarios
    rgbToHsl(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // acromático
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return [h, s, l];
    }
    
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // acromático
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [r, g, b];
    }
}

// Exportar una instancia única
const imageAdjuster = new ImageAdjuster();
export default imageAdjuster;

/**
 * Inicializa los eventos para los controles de ajuste de imagen
 * @param {Cropper} cropper - Instancia del cropper
 */
export function initImageAdjustments(cropper) {
    // Obtener elementos
    const brightnessSlider = document.getElementById('brightness');
    const contrastSlider = document.getElementById('contrast');
    const saturationSlider = document.getElementById('saturation');
    const vibranceSlider = document.getElementById('vibrance');
    const lutPresetSelect = document.getElementById('lutPreset');
    const resetButton = document.getElementById('resetAdjustments');
    
    console.log("Inicializando ajustes de imagen", {
        brightnessSlider,
        contrastSlider,
        saturationSlider,
        vibranceSlider,
        lutPresetSelect,
        resetButton
    });
    
    // Mostrar información sobre el cropper para diagnóstico
    if (cropper) {
        console.log("Estado del cropper:", {
            ready: cropper.ready,
            canvas: cropper.canvas,
            cropBox: cropper.cropBox,
            options: cropper.options
        });
    } else {
        console.error("ERROR: No se proporcionó un objeto cropper válido");
    }
    
    // Función para actualizar ajustes desde UI con throttling
    let timeout = null;
    const updateFromUI = () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        
        timeout = setTimeout(() => {
            if (!cropper || !cropper.ready) {
                console.log("Cropper no listo para actualizaciones");
                return;
            }
            
            const newSettings = {
                brightness: parseInt(brightnessSlider.value),
                contrast: parseInt(contrastSlider.value),
                saturation: parseInt(saturationSlider.value),
                vibrance: parseInt(vibranceSlider.value),
                lutPreset: lutPresetSelect.value
            };
            
            console.log("Actualizando desde UI:", newSettings);
            imageAdjuster.updateSettings(newSettings);
            imageAdjuster.apply(cropper);
            timeout = null;
        }, 50); // Pequeño throttle para evitar demasiadas actualizaciones
    };
    
    // Añadir event listeners
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', updateFromUI);
    }
    
    if (contrastSlider) {
        contrastSlider.addEventListener('input', updateFromUI);
    }
    
    if (saturationSlider) {
        saturationSlider.addEventListener('input', updateFromUI);
    }
    
    if (vibranceSlider) {
        vibranceSlider.addEventListener('input', updateFromUI);
    }
    
    if (lutPresetSelect) {
        lutPresetSelect.addEventListener('change', event => {
            console.log(`LUT seleccionado: ${event.target.value}`);
            updateFromUI();
        });
    }
    
    // Resetear ajustes
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            console.log("Botón Reset presionado");
            const settings = imageAdjuster.resetSettings();
            
            // Actualizar UI
            if (brightnessSlider) brightnessSlider.value = settings.brightness;
            if (contrastSlider) contrastSlider.value = settings.contrast;
            if (saturationSlider) saturationSlider.value = settings.saturation;
            if (vibranceSlider) vibranceSlider.value = settings.vibrance;
            if (lutPresetSelect) lutPresetSelect.value = settings.lutPreset;
            
            // Limpiar estado (overlay, listeners, filtros CSS)
            // Llamar a apply() se encargará de esto ahora
            imageAdjuster.apply(cropper);
            console.log("Ajustes reseteados y apply() llamado");
        });
    }
} 