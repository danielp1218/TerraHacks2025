// WeakMap to store original styles for each element
const originalStyles = new WeakMap<HTMLElement, Map<string, string>>();

export const styleElement = (element: HTMLElement, style: ElementStyle) => {
    console.log("Applying styles to element:", element, "with style:", style);
    // Get or create the original styles map for this element
    if (!originalStyles.has(element)) {
        originalStyles.set(element, new Map());
    }
    const elementOriginalStyles = originalStyles.get(element)!;

    Object.entries(style).forEach(([prop, value]) => {
        // Store the original value before overwriting (only if not already stored)
        if (!elementOriginalStyles.has(prop)) {
            const originalValue = element.style.getPropertyValue(prop);
            elementOriginalStyles.set(prop, originalValue);
        }
        
        // Apply the new style
        element.style.setProperty(prop, String(value));
    });
};

export const unstyleElement = (element: HTMLElement, style: ElementStyle) => {
    console.log("Restoring styles for element:", element, "with style:", style);
    const elementOriginalStyles = originalStyles.get(element);
    if (!elementOriginalStyles) return; // No original styles stored

    Object.entries(style).forEach(([prop, value]) => {
        const originalValue = elementOriginalStyles.get(prop);
        if (originalValue !== undefined) {
            if (originalValue === '') {
                // If original value was empty, remove the property
                element.style.removeProperty(prop);
            } else {
                // Restore the original value
                element.style.setProperty(prop, originalValue);
            }
            // Remove from our tracking since it's restored
            elementOriginalStyles.delete(prop);
        }
    });

    // Clean up the WeakMap entry if no more styles are being tracked
    if (elementOriginalStyles.size === 0) {
        originalStyles.delete(element);
    }
};

// Utility to reset all tracked styles for an element
export const resetElementStyles = (element: HTMLElement) => {
    const elementOriginalStyles = originalStyles.get(element);
    if (!elementOriginalStyles) return;

    elementOriginalStyles.forEach((originalValue, prop) => {
        if (originalValue === '') {
            element.style.removeProperty(prop);
        } else {
            element.style.setProperty(prop, originalValue);
        }
    });

    originalStyles.delete(element);
};