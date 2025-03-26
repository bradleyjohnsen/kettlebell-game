// Simple script to generate a favicon.png from our SVG design
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');

// Draw background circle
ctx.fillStyle = '#e74c3c'; // Red background matching the game's shirt color
ctx.beginPath();
ctx.arc(16, 16, 16, 0, Math.PI * 2);
ctx.fill();

// Draw kettlebell body
ctx.fillStyle = '#333333';
ctx.strokeStyle = '#000000';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.arc(16, 18, 10, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();

// Draw kettlebell handle
ctx.fillStyle = '#555555';
ctx.beginPath();
ctx.rect(10, 12, 12, 3);
ctx.fill();
ctx.stroke();

// Draw handle top curve
ctx.beginPath();
ctx.moveTo(10, 12);
ctx.bezierCurveTo(10, 8, 22, 8, 22, 12);
ctx.fill();
ctx.stroke();

// Convert to PNG data URL
const dataURL = canvas.toDataURL('image/png');
console.log('Favicon PNG data URL:');
console.log(dataURL);

// In a browser environment, you would use this to download:
// const link = document.createElement('a');
// link.download = 'favicon.png';
// link.href = dataURL;
// link.click();
