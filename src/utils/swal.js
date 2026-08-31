import Swal from 'sweetalert2';

// Custom SweetAlert2 Cyber / Apex Gym Theme Mixin
export const CustomSwal = Swal.mixin({
  background: '#0d0d12',
  color: '#ffffff',
  confirmButtonColor: '#c6ff00',
  cancelButtonColor: '#ff3e6c',
  customClass: {
    popup: 'cyber-swal-popup',
    title: 'cyber-swal-title',
    htmlContainer: 'cyber-swal-content',
    confirmButton: 'glow-btn cyber-swal-btn',
    cancelButton: 'outline-btn cyber-swal-cancel-btn'
  },
  buttonsStyling: false
});

// Toast SweetAlert popup helper
export const ToastSwal = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#12121a',
  color: '#ffffff',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export default CustomSwal;
