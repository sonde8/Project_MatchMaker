// // 회원가입 전화번호 입력칸
// function oninputPhone(target) {
//     target.value = target.value
//         .replace(/[^0-9]/g, '')
//         .replace(/(^02.{0}|^01.{1}|[0-9]{3,4})([0-9]{3,4})([0-9]{4})/g, "$1-$2-$3");
// }

// 회원가입 유효성 검사
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');

    async function checkUsername() {
        const username = usernameInput.value;
        try {
            const response = await fetch('/check-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });
            const data = await response.json();
            
            if (data.exists) {
                usernameError.textContent = '이미 존재하는 아이디입니다';
                return false;
            } else {
                usernameError.textContent = '';
                return true;
            }
        } catch (error) {
            console.error('Error:', error);
            usernameError.textContent = '서버 오류가 발생했습니다';
            return false;
        }
    }

    function checkPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
            passwordError.textContent = '비밀번호가 일치하지 않습니다';
            return false;
        } else {
            passwordError.textContent = '';
            return true;
        }
    }
    
    // 이벤트 리스너 수정
    usernameInput.addEventListener('blur', async () => {
        await checkUsername();
    });

    confirmPasswordInput.addEventListener('input', checkPassword);
    
    // handleSubmit 함수도 async로 수정
    async function handleSubmit(event) {
        event.preventDefault();
        
        const isUsernameValid = await checkUsername();
        const isPasswordValid = checkPassword();
    
        if (isUsernameValid && isPasswordValid) {
            // 회원가입 로직
            console.log('회원가입 성공!');
            form.setAttribute('method','post')
            form.submit();
            // 여기에 실제 회원가입 처리 코드를 추가하세요
        } else {
            alert("아이디나 비밀번호를 확인해주세요");
        }
    }
    
    form.addEventListener('submit', handleSubmit);
});