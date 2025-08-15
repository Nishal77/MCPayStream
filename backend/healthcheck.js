import fetch from 'node-fetch';

const healthCheck = async () => {
  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
};

healthCheck();
