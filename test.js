const text = '[Image](https://kamlesh6377.pythonanywhere.com/api/public/documents/download/broadcast_123_test.png)\n\nHIIIIIIIIIIIIIIIIIIII\nheloooooooooooooooooooo';
let formatted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
formatted = formatted.replace(/\[Image\]\((.*?)\)/gi, "<div class='mt-2 mb-2 w-full max-w-sm'><img src='$1' alt='Notification Image' class='w-full rounded-[8px] border border-slate-200 object-cover shadow-sm' /></div>");
formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank'>$1</a>");
const parts = formatted.split(/(<[^>]+>)/g);
for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
        parts[i] = parts[i].replace(/(https?:\/\/[^\s<]+)/g, "<a href='$1'>$1</a>");
    }
}
formatted = parts.join('');
console.log(formatted);
