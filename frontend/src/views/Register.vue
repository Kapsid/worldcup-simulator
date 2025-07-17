<template>
  <div class="register-container">
    <RegisterForm 
      @register-success="handleRegisterSuccess" 
      @switch-to-login="handleSwitchToLogin"
    />
  </div>
</template>

<script>
import RegisterForm from '../components/RegisterForm.vue'

export default {
  name: 'Register',
  components: {
    RegisterForm
  },
  methods: {
    handleRegisterSuccess(data) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      this.$router.push('/dashboard')
    },
    
    handleSwitchToLogin() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.register-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 102, 204, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(0, 170, 68, 0.2) 0%, transparent 50%);
  z-index: -1;
}

@media (max-width: 768px) {
  .register-container {
    padding: 16px;
  }
}
</style>