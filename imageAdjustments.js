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
        this._zoomListener = null;
        
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
    
    /**
     * Thoroughly removes any existing overlays and clears CSS filters
     */
    removeOverlay() {
        if (this.debug) console.log("removeOverlay: Starting thorough cleanup");
        
        try {
            // 1. Primero OCULTAR visualmente cualquier overlay antes de eliminar
            // Esto produce una transición visual más suave
            const allOverlaysInDocument = document.querySelectorAll('.image-adjuster-overlay');
            if (allOverlaysInDocument.length > 0) {
                // Ocultar primero (inmediato visualmente)
                allOverlaysInDocument.forEach(overlay => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '0';
                });
                
                if (this.debug) console.log(`removeOverlay: Ocultados ${allOverlaysInDocument.length} overlays`);
                
                // Luego eliminar después de ocultar
                allOverlaysInDocument.forEach(overlay => {
                    overlay.remove();
                });
                
                if (this.debug) console.log(`removeOverlay: Eliminados ${allOverlaysInDocument.length} overlays`);
            } else {
                if (this.debug) console.log(`removeOverlay: No se encontraron overlays en el documento`);
            }
            
            // 2. Limpiar filtros CSS del view box
            const viewBox = document.querySelector('.cropper-view-box');
            if (viewBox) {
                viewBox.style.filter = 'none';
                if (this.debug) console.log("removeOverlay: Filtros CSS eliminados del view-box");
            }
            
            // 3. Desconectar listeners para evitar creaciones inesperadas de canvas
            const cropperImage = document.querySelector('.cropper-container img');
            if (cropperImage) {
                if (this.debug) console.log("removeOverlay: Desconectando crop listeners");
                this.detachCropListeners({ element: cropperImage });
            }
        } catch (error) {
            console.error("Error en método removeOverlay:", error);
        }
        
        if (this.debug) console.log("removeOverlay: Limpieza completa");
    }
    
    /**
     * Detaches crop event listeners from the cropper element
     * @param {Object} cropper - Object with element property to detach listeners from
     */
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
        
        if (this._zoomListener) {
            cropper.element.removeEventListener('zoom', this._zoomListener);
            this._zoomListener = null;
            if (this.debug) console.log("Listener de zoom eliminado");
        }
    }
    
    /**
     * Aplica los ajustes a la imagen en el cropper
     * @param {Cropper} cropper - Instancia del cropper
     * @param {Function} callback - Función opcional a llamar cuando se complete el proceso
     */
    apply(cropper, callback = null) {
        if (!cropper || !cropper.ready) {
            if (this.debug) console.log("Cropper no está listo");
            if (callback) callback(false);
            return;
        }
        
        try {
            // Primero limpiar completamente cualquier overlay o filtro existente
            this.removeOverlay();
            
            // Esperar un instante para que la limpieza sea visible antes de aplicar nuevos ajustes
            // Aumentado a 20ms para dar tiempo al cropper después de cambios de aspect ratio
            setTimeout(() => {
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
                        if (callback) callback(false);
                        return;
                    }
                    
                    // Check if adjustments are neutral AND noise is zero
                    const noiseLevelSelect = document.getElementById('noiseLevelSelect');
                    const noiseIntensity = noiseLevelSelect ? parseInt(noiseLevelSelect.value, 10) : 0;
                    const trulyNeutral = this.isNeutral() && noiseIntensity === 0;
                    
                    // Si hay ruido activo, log para diagnóstico
                    if (noiseIntensity > 0) {
                        console.log(`apply(): Ruido activo con intensidad ${noiseIntensity}`);
                    }
                    
                    // Si todos los valores son neutros Y no hay ruido, terminamos aquí (ya limpiamos)
                    if (trulyNeutral) {
                        if (this.debug) console.log("apply(): Todos los valores son neutros (incluido el ruido), estado limpio.");
                        if (callback) callback(true);
                        return;
                    }
                    
                    // ENFOQUE 1: Para efectos básicos usamos filtros CSS (Should not happen due to canUseSimpleCSSFilters being false)
                    if (this.canUseSimpleCSSFilters()) {
                        const filters = this.generateCSSFilters();
                        if (this.debug) console.log("apply(): Aplicando filtros CSS simples:", filters);
                        cropperViewBox.style.filter = filters;
                        // No necesitamos overlay ni listeners para CSS
                        if (callback) callback(true);
                        return;
                    }
                    
                    // ENFOQUE 2: Usamos overlay para todos los ajustes visuales (incluido solo ruido)
                    if (this.debug) console.log("apply(): Aplicando efectos avanzados mediante overlay (incluye ruido si está activo)");
                    // Pasar el container es importante
                    if (cropperContainer) {
                        this.applyOverlayEffects(cropper, cropperViewBox, cropperContainer, callback);
                    } else {
                        if (this.debug) console.error("apply(): No se encontró cropper-container para aplicar overlay");
                        if (callback) callback(false);
                    }
                } catch (error) {
                    console.error('Error en apply() (fase secundaria):', error);
                    if (callback) callback(false);
                }
            }, 20); // Aumentado a 20ms para permitir que el cropper actualice completamente
        } catch (error) {
            console.error('Error en apply() (fase inicial):', error);
            if (callback) callback(false);
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
        // Always return false to force canvas-based adjustments for all operations
        // This gives a real preview of how the final image will look
        return false;
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
     * @param {Function} callback - Función opcional a llamar cuando se complete el proceso
     */
    applyOverlayEffects(cropper, viewBox, container, callback) {
        if (!cropper || !viewBox || !container) return;

        const cropBox = container.querySelector('.cropper-crop-box');
        if (!cropBox) {
             if (this.debug) console.error("applyOverlayEffects: No se encontró .cropper-crop-box");
             return;
        }
        
        try {
            if (this.debug) console.log("applyOverlayEffects: Iniciando creación de overlay dentro de crop-box");
        
            // --- Crear o encontrar y posicionar overlay --- 
            let overlayCanvas = cropBox.querySelector('.image-adjuster-overlay');
            if (!overlayCanvas) {
                overlayCanvas = document.createElement('canvas');
                overlayCanvas.className = 'image-adjuster-overlay';
                overlayCanvas.style.position = 'absolute';
                overlayCanvas.style.top = '0px'; 
                overlayCanvas.style.left = '0px';
                overlayCanvas.style.zIndex = '2'; 
                overlayCanvas.style.pointerEvents = 'none';
                overlayCanvas.style.imageRendering = 'pixelated'; 
                cropBox.appendChild(overlayCanvas);
                if (this.debug) console.log("applyOverlayEffects: Overlay CREADO y añadido a crop-box");
            } else {
                if (this.debug) console.log("applyOverlayEffects: Overlay existente encontrado.");
            }
        
            // Actualizar tamaño y dibujar (esta lógica ahora está en redrawAndUpdateOverlay)
            // Pero necesitamos una llamada inicial para mostrarlo si no es una interacción
            
            // --- Listener Management --- 
            this.detachCropListeners(cropper); 
            const self = this;
            let updateTimeout = null; // Timeout unificado para debounce
        
            // --- FUNCIÓN CENTRALIZADA PARA REDIBUJAR CON DEBOUNCE --- 
            const debouncedRedraw = () => {
                if (updateTimeout) {
                    clearTimeout(updateTimeout);
                }
                updateTimeout = setTimeout(() => {
                    if (self.debug) console.log("Debounced Redraw: Ejecutando...");
                    redrawAndUpdateOverlay(); // Llamar a la función de redibujado real
                    updateTimeout = null; // Limpiar referencia de timeout
                }, 250); // Mantener debounce
            };

            // --- FUNCIÓN INTERNA PARA REDIBUJAR (LA LÓGICA REAL) --- 
            const redrawAndUpdateOverlay = () => {
                if (self.debug) console.log("redrawAndUpdateOverlay: Iniciando redibujado");
                // Asegurarse que el overlay aún existe antes de continuar
                const currentOverlay = cropBox.querySelector('.image-adjuster-overlay');
                if (!currentOverlay) {
                    if (self.debug) console.error("redrawAndUpdateOverlay: Overlay no encontrado!");
                    if (callback) callback(false);
                 return;
            }

                try {
                    const currentViewBox = document.querySelector('.cropper-view-box'); 
                    if (currentViewBox) {
                        const updatedViewBoxRect = currentViewBox.getBoundingClientRect();
                        if (updatedViewBoxRect.width <= 0 || updatedViewBoxRect.height <= 0) {
                             if (self.debug) console.warn("redrawAndUpdateOverlay: ViewBox con dimensiones 0, omitiendo redibujo.");
                             currentOverlay.style.display = 'none';
                             if (callback) callback(false);
                 return;
            }

                        // Actualizar tamaño del canvas existente
                        currentOverlay.width = updatedViewBoxRect.width;
                        currentOverlay.height = updatedViewBoxRect.height;
                        currentOverlay.style.width = `${updatedViewBoxRect.width}px`;
                        currentOverlay.style.height = `${updatedViewBoxRect.height}px`;

                        // Get current noise level from the DOM
                        const noiseLevelSelect = document.getElementById('noiseLevelSelect');
                        const noiseIntensity = noiseLevelSelect ? parseInt(noiseLevelSelect.value, 10) : 0;

                        const newCroppedCanvas = cropper.getCroppedCanvas({
                            width: updatedViewBoxRect.width * window.devicePixelRatio,
                            height: updatedViewBoxRect.height * window.devicePixelRatio,
                            imageSmoothingEnabled: true,
                            imageSmoothingQuality: 'medium'
                        });
                        if(newCroppedCanvas) {
                            const newCtx = currentOverlay.getContext('2d', { willReadFrequently: true });
                            newCtx.clearRect(0, 0, currentOverlay.width, currentOverlay.height);
                            newCtx.drawImage(newCroppedCanvas, 0, 0, currentOverlay.width, currentOverlay.height);
                            let newImageData = newCtx.getImageData(0, 0, currentOverlay.width, currentOverlay.height);
                            // Pass noise intensity to the adjustment function
                            let newModifiedImageData = self.applyAdjustmentsToImageData(newImageData, self.settings, noiseIntensity);
                            newCtx.putImageData(newModifiedImageData, 0, 0);

                            currentOverlay.style.display = 'block'; 
                            if (self.debug) console.log("redrawAndUpdateOverlay: Overlay actualizado y mostrado");
                            if (callback) callback(true); // Notify that processing is complete
                        } else {
                             if (self.debug) console.error("redrawAndUpdateOverlay: No se pudo obtener newCroppedCanvas");
                             currentOverlay.style.display = 'none'; 
                             if (callback) callback(false);
                        }
                    } else {
                        if (self.debug) console.error("redrawAndUpdateOverlay: No se encontró viewBox");
                        if(currentOverlay) currentOverlay.style.display = 'none';
                        if (callback) callback(false);
                    }
                } catch(error) {
                     console.error("Error dentro de redrawAndUpdateOverlay:", error);
                     if(currentOverlay) currentOverlay.style.display = 'none';
                     if (callback) callback(false);
                }
            };
            // --- FIN FUNCIONES INTERNAS --- 

            // --- DEFINICIÓN DE LISTENERS --- 
            this._cropStartListener = () => {
                if (self.debug) console.log("Event: cropstart - Ocultando overlay");
                const existingOverlay = cropBox.querySelector('.image-adjuster-overlay');
                if (existingOverlay) existingOverlay.style.display = 'none';
                if (updateTimeout) clearTimeout(updateTimeout);
                updateTimeout = null;
            };

            this._cropEndListener = () => {
                if (self.debug) console.log("Event: cropend - Programando redibujo debounced");
                debouncedRedraw(); // Usar la función centralizada con debounce
            };
            
            this._zoomListener = (event) => {
                 // El evento zoom se dispara continuamente mientras se hace zoom
                 // Ocultar el overlay inmediatamente al detectar inicio de zoom
                 const existingOverlay = cropBox.querySelector('.image-adjuster-overlay');
                 if (existingOverlay && existingOverlay.style.display !== 'none') {
                      if (self.debug) console.log("Event: zoom detectado - Ocultando overlay");
                      existingOverlay.style.display = 'none';
                 }
                 // Programar el redibujo debounced para cuando termine el zoom
                 if (self.debug) console.log("Event: zoom - Programando redibujo debounced");
                 debouncedRedraw(); 
            };

            // --- ATTACH LISTENERS --- 
            cropper.element.addEventListener('cropstart', this._cropStartListener);
            cropper.element.addEventListener('cropend', this._cropEndListener);
            cropper.element.addEventListener('zoom', this._zoomListener); // Añadir listener de zoom
            if (this.debug) console.log("applyOverlayEffects: Listeners añadidos (cropstart, cropend, zoom)");
            
            // --- LLAMADA INICIAL PARA MOSTRAR --- 
            // Llamar a redraw directamente la primera vez que se aplica el efecto
            redrawAndUpdateOverlay();

        } catch (error) {
            console.error("Error en applyOverlayEffects:", error);
            viewBox.style.filter = this.generateAllCSSFilters(); // Fallback
        }
    }
    
    /**
     * Función pública para forzar el redibujado del overlay.
     * Útil para llamar después de acciones programáticas como setAspectRatio.
     * @param {Cropper} cropper - Instancia del cropper
     */
    redrawOverlay(cropper) {
        if (!cropper || !cropper.ready) {
            if (this.debug) console.log("redrawOverlay: Cropper no listo.");
            return;
        }
        const container = document.querySelector('.cropper-container');
        const cropBox = container?.querySelector('.cropper-crop-box');
        const overlay = cropBox?.querySelector('.image-adjuster-overlay');
        
        // Get current noise level from the DOM - Moved here for early check
        const noiseLevelSelect = document.getElementById('noiseLevelSelect');
        const noiseIntensity = noiseLevelSelect ? parseInt(noiseLevelSelect.value, 10) : 0;
        
        // Check if any adjustments or noise is active
        const onlyNoiseActive = this.isNeutral() && noiseIntensity > 0;
        const anyAdjustments = !this.isNeutral() || noiseIntensity > 0;
        
        // Log for diagnosis
        console.log(`redrawOverlay: noise=${noiseIntensity}, onlyNoise=${onlyNoiseActive}, anyAdjust=${anyAdjustments}`);
        
        if (overlay && cropBox) {
             if (this.debug) console.log("redrawOverlay: Forzando redibujado...");
             // Reutilizamos la lógica interna, adaptándola ligeramente
             try {
                 const currentViewBox = document.querySelector('.cropper-view-box');
                 if (currentViewBox) {
                     const updatedViewBoxRect = currentViewBox.getBoundingClientRect();
                     overlay.width = updatedViewBoxRect.width;
                     overlay.height = updatedViewBoxRect.height;
                     overlay.style.width = `${updatedViewBoxRect.width}px`;
                     overlay.style.height = `${updatedViewBoxRect.height}px`;
                     
                     const newCroppedCanvas = cropper.getCroppedCanvas({
                         width: updatedViewBoxRect.width * window.devicePixelRatio,
                         height: updatedViewBoxRect.height * window.devicePixelRatio,
                         imageSmoothingEnabled: true,
                         imageSmoothingQuality: 'medium'
                     });
                     
                     if (newCroppedCanvas) {
                         const newCtx = overlay.getContext('2d', { willReadFrequently: true });
                         newCtx.clearRect(0, 0, overlay.width, overlay.height);
                         newCtx.drawImage(newCroppedCanvas, 0, 0, overlay.width, overlay.height);
                         let newImageData = newCtx.getImageData(0, 0, overlay.width, overlay.height);
                         
                         // Apply adjustments and possibly noise
                         let newModifiedImageData = this.applyAdjustmentsToImageData(newImageData, this.settings, noiseIntensity);
                         newCtx.putImageData(newModifiedImageData, 0, 0);
                         
                         // Make sure overlay is visible 
                         overlay.style.display = 'block';
                         
                         if (this.debug || noiseIntensity > 0) {
                             console.log(`redrawOverlay: Completado con ruido=${noiseIntensity}`);
                         }
                     } else {
                         console.error("redrawOverlay: No se pudo obtener newCroppedCanvas.");
                         overlay.style.display = 'none';
                     }
                 } else {
                     console.error("redrawOverlay: No se encontró viewBox.");
                     overlay.style.display = 'none';
                 }
             } catch (error) {
                 console.error("Error en redrawOverlay:", error);
                 if (overlay) overlay.style.display = 'none';
             }
         } else if (anyAdjustments) {
             console.log("redrawOverlay: No se encontró overlay pero hay ajustes activos. Necesita crearse.");
             // Si no hay overlay pero hay ajustes activos (incluido solo ruido),
             // debemos asegurarnos de que se cree correctamente
             if (cropper && cropper.ready) {
                 // Use apply with a small delay to prevent potential recursion
                 setTimeout(() => {
                     this.apply(cropper);
                 }, 10);
             }
         } else {
             if (this.debug) console.log("redrawOverlay: No se encontró overlay y no hay ajustes activos.");
        }
    }

    /**
     * Aplica todos los ajustes configurados directamente a un objeto ImageData.
     * @param {ImageData} imageData - El objeto ImageData a modificar.
     * @param {Object} settings - Los ajustes a aplicar (this.settings).
     * @param {number} [noiseIntensity=0] - Intensidad del ruido a aplicar (0-100).
     * @returns {ImageData} El objeto ImageData modificado.
     */
    applyAdjustmentsToImageData(imageData, settings, noiseIntensity = 0) {
        if (this.debug) console.log("applyAdjustmentsToImageData: Iniciando con settings:", settings, "Noise:", noiseIntensity);
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
                    let [h, s, l] = this.rgbToHsl(r, g, b); // Use class method for HSL conversion

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

                    // Convert back to RGB [0, 255] range
                    let [newR, newG, newB] = this.hslToRgb(h, s, l); // Use class method for RGB conversion
                    r = newR;
                    g = newG;
                    b = newB;
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
            
            // 5. Apply Noise (after all other adjustments)
            if (noiseIntensity > 0) {
                if (this.debug) console.log(`applyAdjustmentsToImageData: Applying noise with intensity ${noiseIntensity}`);
                this.applyNoise(data, width, height, noiseIntensity);
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
        // Converts RGB [0, 255] to HSL [0, 1]
        r /= 255, g /= 255, b /= 255;
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
        // Converts HSL [0, 1] to RGB [0, 255]
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
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    /**
     * Aplica ruido aleatorio a los datos de imagen
     * @param {Uint8ClampedArray} imageDataData - Array de datos de imagen (solo el .data)
     * @param {number} width - Ancho de la imagen
     * @param {number} height - Alto de la imagen
     * @param {number} intensity - Intensidad del ruido (0-100)
     */
    applyNoise(imageDataData, width, height, intensity) {
        const noiseLevel = Math.min(100, Math.max(0, intensity)) / 100;
        const maxLightnessNoise = noiseLevel * 0.5;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;

                let r = imageDataData[index];
                let g = imageDataData[index + 1];
                let b = imageDataData[index + 2];

                // Convert to HSL, add noise to lightness, convert back
                let [h, s, l] = this.rgbToHsl(r, g, b); // Use class method
                const lightnessNoise = (Math.random() * 2 - 1) * maxLightnessNoise;
                let noisyL = Math.max(0, Math.min(1, l + lightnessNoise));
                let [newR, newG, newB] = this.hslToRgb(h, s, noisyL); // Use class method

                imageDataData[index] = newR;
                imageDataData[index + 1] = newG;
                imageDataData[index + 2] = newB;
                // Alpha (imageDataData[index + 3]) remains unchanged
            }
        }
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
    const processingIndicator = document.getElementById('processingAdjustments');
    const noiseLevelSelect = document.getElementById('noiseLevelSelect'); // Get noise select
    
    console.log("Inicializando ajustes de imagen", {
        brightnessSlider,
        contrastSlider,
        saturationSlider,
        vibranceSlider,
        lutPresetSelect,
        resetButton,
        processingIndicator,
        noiseLevelSelect // Log noise select
    });
    
    // Mostrar información sobre el cropper para diagnóstico
    if (cropper) {
        console.log("Estado del cropper:", {
            ready: cropper.ready,
            canvas: cropper.canvas,
            cropBox: cropper.cropBox,
            options: cropper.options
        });
        
        // Add event listener to refresh LUTs when crop area changes (including aspect ratio)
        if (cropper.element) {
            cropper.element.addEventListener('crop', function onCropEvent() {
                // Get noise level from DOM
                const noiseLevelSelect = document.getElementById('noiseLevelSelect');
                const noiseIntensity = noiseLevelSelect ? parseInt(noiseLevelSelect.value, 10) : 0;
                
                // Skip if no cropper or image adjuster is neutral AND there's no noise
                if ((!imageAdjuster || imageAdjuster.isNeutral()) && noiseIntensity === 0) {
                    return;
                }
                
                // Use debouncing to avoid excessive updates
                if (window.cropDebounceTimeout) {
                    clearTimeout(window.cropDebounceTimeout);
                }
                
                window.cropDebounceTimeout = setTimeout(() => {
                    console.log('Crop area changed - redrawing LUT/noise overlay');
                    // Show processing indicator
                    if (processingIndicator) {
                        processingIndicator.classList.add('show');
                    }
                    // Completely remove and reapply overlay
                    imageAdjuster.removeOverlay();
                    imageAdjuster.apply(cropper, (success) => {
                        // Hide processing indicator when complete
                        if (processingIndicator) {
                            processingIndicator.classList.remove('show');
                        }
                    });
                }, 150); // Reduced debounce time for better responsiveness
            });
            console.log("Added global crop event listener for LUT/noise reapplication");
        }
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
                // Noise level is handled directly during adjustment application,
                // no need to store it in imageAdjuster.settings
            };
            
            console.log("Actualizando desde UI:", newSettings);
            
            // Show processing indicator
            if (processingIndicator) {
                processingIndicator.classList.add('show');
            }
            
            imageAdjuster.updateSettings(newSettings);
            imageAdjuster.apply(cropper, (success) => {
                // Hide processing indicator when complete
                if (processingIndicator) {
                    setTimeout(() => {
                        processingIndicator.classList.remove('show');
                    }, 300); // Add a small delay so user can see it was processed
                }
            });
            
            timeout = null;
        }, 200); // Increased throttle to reduce frequency of heavy operations
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
    
    // Add event listener for noise level change
    if (noiseLevelSelect) {
        noiseLevelSelect.addEventListener('change', event => {
            console.log(`Noise level seleccionado: ${event.target.value}`);
            updateFromUI(); // Trigger the same update function
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
            if (noiseLevelSelect) noiseLevelSelect.value = '0'; // Reset noise dropdown
            
            // Show processing indicator
            if (processingIndicator) {
                processingIndicator.classList.add('show');
            }
            
            // Limpiar estado (overlay, listeners, filtros CSS)
            // Llamar a apply() se encargará de esto ahora (will apply with noise=0)
            imageAdjuster.apply(cropper, (success) => {
                // Hide processing indicator when complete
                if (processingIndicator) {
                    setTimeout(() => {
                        processingIndicator.classList.remove('show');
                    }, 300); // Short delay for visual feedback
                }
            });
            console.log("Ajustes reseteados y apply() llamado");
        });
    }
} 