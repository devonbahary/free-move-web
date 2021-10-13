export const observer = (reference, onChange, oldReference) => {
    if (reference !== oldReference) {
        onChange(reference);
    }
  
    return (newRef) => observer(newRef, onChange, reference);
};
