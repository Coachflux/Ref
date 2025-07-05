
  const balanceEl = document.getElementById('balance');
  const rankEl = document.getElementById('rank');
  const rankDetails = document.getElementById('rankDetails');
  const rankBar = document.getElementById('rankProgress');
  const withdrawal = document.getElementById('withdrawal');
  const loader = document.getElementById('loader');
  const popup = document.getElementById('processingPopup');
  const errorMsg = document.getElementById('errorMsg');

  function toggleCalendar() {
    const cal = document.getElementById('calendarPopup');
    cal.style.display = cal.style.display === 'block' ? 'none' : 'block';
  }

  function toggleWithdraw() {
    withdrawal.style.display = withdrawal.style.display === 'block' ? 'none' : 'block';
  }

  rankEl.addEventListener('click', () => {
    rankDetails.style.display = rankDetails.style.display === 'block' ? 'none' : 'block';
  });

  function submitWithdraw() {
    const wallet = document.getElementById('wallet');
    const amount = document.getElementById('amount');

    if (!wallet.value || !amount.value) {
      alert('Fill in details');
      return;
    }

    const numAmount = parseFloat(amount.value.replace('$', ''));
    const currentBal = 0; // You may replace this with actual logic later
    if (numAmount > currentBal) {
      amount.classList.add('invalid');
      amount.value = 'Invalid Amount';
      return;
    }

    loader.style.display = 'block';
    setTimeout(() => {
      loader.style.display = 'none';
      popup.style.display = 'block';
      setTimeout(() => {
        errorMsg.textContent = "Your transaction cannot be processed now, you have to reach supreme rank for your transactions to be processed.";
      }, 15000);
    }, 5000);
  }

  function closePopup() {
    popup.style.display = 'none';
    errorMsg.textContent = '';
  }
