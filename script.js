// ВСТАВЬ СЮДА СВОЙ КЛЮЧ с web3forms.com (придёт на почту после регистрации).
// Пока ключ не вставлен, письма не отправляются, а сайт работает как обычно.
const WEB3FORMS_KEY = "13951c6e-52c5-49af-b4ba-16152db0ab44";

// ---------- Отправка письма тебе ----------
function sendToMe(subject, message) {
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY === "13951c6e-52c5-49af-b4ba-16152db0ab44") {
        console.warn("Ключ Web3Forms не вставлен: письмо не отправлено.");
        return Promise.resolve(true);
    }
    return fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: subject, message: message }),
        keepalive: true
    })
        .then(r => r.json())
        .then(d => !!d.success)
        .catch(() => false);
}

// =====================================================================
//  ГЛАВНАЯ СТРАНИЦА: «Да» и «Нет»
// =====================================================================
// Что показывается после каждого «Нет». Четвёртое «Нет» уже окончательное.
const noStages = [
    { emoji: "🥺", text: "Ты уверена? Подумай ещё чуть-чуть...", button: "Всё-таки нет" },
    { emoji: "😢", text: "Мне станет очень грустно...", button: "Нет" },
    { emoji: "😭", text: "Это последний шанс передумать...", button: "Нет, окончательно" }
];

let noClicks = 0;
let answered = false;

function handleNoClick() {
    if (answered) return;

    if (noClicks >= noStages.length) {
        finalNo();
        return;
    }

    const stage = noStages[noClicks];
    noClicks++;

    const noButton = document.querySelector(".no-button");
    const yesButton = document.querySelector(".yes-button");
    const card = document.querySelector(".card");
    const sad = document.getElementById("sad");

    document.querySelector(".gif_container").hidden = true;
    sad.hidden = false;
    sad.textContent = stage.emoji;
    document.getElementById("subtext").textContent = stage.text;
    noButton.textContent = stage.button;

    const currentSize = parseFloat(window.getComputedStyle(yesButton).fontSize);
    yesButton.style.fontSize = `${Math.min(currentSize * 1.3, 56)}px`;

    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
}

function finalNo() {
    answered = true;
    sendToMe("Она ответила «Нет»", "Она нажала «Нет» " + (noClicks + 1) + " раз(а) и ответила окончательно.");
    setTimeout(() => { window.location.replace("no_page.html"); }, 300);
}

function handleYesClick() {
    if (answered) return;
    answered = true;
    const subject = noClicks === 0
        ? "Она сказала ДА с первого раза! 🎉"
        : "Она сказала ДА, передумав после " + noClicks + " «Нет» 🎉";
    sendToMe(subject, "Она нажала «Да» на сайте. Сейчас выбирает детали свидания.");
    setTimeout(() => { window.location.href = "yes_page.html?no=" + noClicks; }, 300);
}

// =====================================================================
//  СТРАНИЦА «ДА»: выбор даты, места и занятия
// =====================================================================
const EXTRA_OPTIONS = ["Мне всё равно, выбери ты 😉"];

const ACTIVITIES = [
    { id: "cafe", emoji: "☕", label: "Кафе", title: "Что хочется попробовать? ☕",
      options: ["Кофе", "Чай", "Десерты", "Бранч / завтрак", "Что-то прохладное"] },
    { id: "restaurant", emoji: "🍽️", label: "Ресторан", title: "Какая кухня? 🍝",
      options: ["Итальянская", "Японская / суши", "Армянская", "Грузинская", "Французская",
                "Мексиканская", "Китайская / азиатская", "Стейки / гриль"] },
    { id: "cinema", emoji: "🎬", label: "Кино", title: "Какой жанр? 🍿",
      options: ["Комедия", "Романтика", "Драма", "Боевик", "Фантастика", "Ужасы", "Мультфильм"] },
    { id: "walk", emoji: "🌳", label: "Прогулка", title: "Где погуляем? 🚶",
      options: ["Парк", "Набережная / у воды", "Центр города", "Природа за городом", "Посмотреть закат"] },
    { id: "fun", emoji: "🎳", label: "Развлечения", title: "Чем займёмся? 🎉",
      options: ["Боулинг", "Квест", "Караоке", "Настолки", "Картинг", "Бильярд", "Что-то активное"] },
    { id: "other", emoji: "💡", label: "Другое", title: null, options: [] }
];

(function initPlanForm() {
    const form = document.getElementById("plan-form");
    if (!form) return;

    // --- Разный текст: «Да» с первого раза или после нескольких «Нет» ---
    const params = new URLSearchParams(window.location.search);
    const noCount = Math.max(0, Math.min(parseInt(params.get("no") || "0", 10) || 0, 10));
    if (noCount > 0) {
        document.getElementById("yes-title").textContent = "Ты передумала, и я счастлив! 🥹";
        document.getElementById("yes-sub").textContent = "Очень рад, что ты передумала 😊 Давай спланируем свидание 👇";
    }

    // --- Дата: прошедшие дни выбрать нельзя ---
    const now = new Date();
    form.elements["date"].min = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    // --- Кнопки «Куда пойти» ---
    const chipsBox = document.getElementById("activity-chips");
    const subpanel = document.getElementById("subpanel");
    let current = null;

    function makeChip(type, name, value, text) {
        const label = document.createElement("label");
        label.className = "chip";
        const input = document.createElement("input");
        input.type = type;
        input.name = name;
        input.value = value;
        const span = document.createElement("span");
        span.textContent = text;
        label.appendChild(input);
        label.appendChild(span);
        return { label, input };
    }

    ACTIVITIES.forEach(act => {
        const { label, input } = makeChip("radio", "activity", act.id, act.emoji + " " + act.label);
        input.addEventListener("change", () => { current = act; renderSubpanel(act); });
        chipsBox.appendChild(label);
    });

    function makeTextInput(id, placeholder) {
        const input = document.createElement("input");
        input.type = "text";
        input.id = id;
        input.maxLength = 120;
        input.placeholder = placeholder;
        return input;
    }

    function renderSubpanel(act) {
        subpanel.textContent = "";
        subpanel.hidden = false;

        if (act.id === "other") {
            const title = document.createElement("p");
            title.className = "field-title";
            title.textContent = "Напиши, куда бы ты хотела 💡";
            subpanel.appendChild(title);
            subpanel.appendChild(makeTextInput("other-main", "Например: на каток"));
            return;
        }

        const title = document.createElement("p");
        title.className = "field-title";
        title.textContent = act.title + " (можно несколько)";
        subpanel.appendChild(title);

        const box = document.createElement("div");
        box.className = "chips";
        act.options.concat(EXTRA_OPTIONS).forEach(opt => {
            box.appendChild(makeChip("checkbox", "sub", opt, opt).label);
        });
        const other = makeChip("checkbox", "sub", "__other", "💡 Другое");
        box.appendChild(other.label);
        subpanel.appendChild(box);

        const otherText = makeTextInput("other-sub", "Напиши свой вариант");
        otherText.hidden = true;
        subpanel.appendChild(otherText);
        other.input.addEventListener("change", () => {
            otherText.hidden = !other.input.checked;
            if (!otherText.hidden) otherText.focus();
        });
    }

    // Возвращает текст выбора или null, если выбрано неполно
    function collectActivity() {
        if (!current) return null;
        const base = current.emoji + " " + current.label;

        if (current.id === "other") {
            const v = document.getElementById("other-main").value.trim();
            return v ? v : null;
        }

        const picks = Array.from(subpanel.querySelectorAll('input[name="sub"]:checked')).map(i => i.value);
        if (picks.length === 0) return null;

        const parts = [];
        for (const v of picks) {
            if (v === "__other") {
                const t = document.getElementById("other-sub").value.trim();
                if (!t) return null;
                parts.push(t);
            } else {
                parts.push(v);
            }
        }
        return base + " — " + parts.join(", ");
    }

    // --- Отправка ---
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const error = document.getElementById("plan-error");
        error.textContent = "";

        const date = form.elements["date"].value;
        const time = form.elements["time"].value;
        const place = form.elements["place"].value.trim();
        const note = form.elements["note"].value.trim();
        const activity = collectActivity();

        if (!date || !time || !place || !current) {
            error.textContent = "Заполни, пожалуйста, дату, время, место и куда пойти 💕";
            return;
        }
        if (!activity) {
            error.textContent = "Выбери хотя бы один вариант (или напиши свой) 💕";
            return;
        }

        const prettyDate = new Date(date + "T00:00:00").toLocaleDateString("ru-RU", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

        const data = { date: date, time: time, place: place, activity: activity, note: note };
        const ev = buildEvent(data);

        // Ссылка для тебя: страница, где можно добавить встречу в календарь
        const addUrl = new URL("add.html", window.location.href);
        addUrl.search = new URLSearchParams({ d: date, h: time, p: place, a: activity, n: note }).toString();

        const message =
            "Она выбрала свидание 💌\n\n" +
            "Дата: " + prettyDate + "\n" +
            "Время: " + time + "\n" +
            "Место встречи: " + place + "\n" +
            "Куда пойти: " + activity + "\n" +
            "Пожелания: " + (note || "—") + "\n\n" +
            "Добавить в Google Календарь:\n" + ev.google + "\n\n" +
            "Добавить в любой календарь (Apple, Outlook):\n" + addUrl.toString();

        const button = form.querySelector(".submit-button");
        button.disabled = true;
        button.textContent = "Отправляю...";

        const ok = await sendToMe("Она выбрала свидание 💌", message);

        if (!ok) {
            button.disabled = false;
            button.textContent = "Отправить 💌";
            error.textContent = "Не получилось отправить. Проверь интернет и попробуй ещё раз.";
            return;
        }

        // --- Экран «жду встречи» ---
        const summary = document.getElementById("plan-summary");
        summary.textContent = "";
        [
            ["📅 Когда", prettyDate + ", " + time],
            ["📍 Где встретимся", place],
            ["✨ Куда пойдём", activity],
            ...(note ? [["💌 Пожелания", note]] : [])
        ].forEach(([label, value]) => {
            const line = document.createElement("div");
            const b = document.createElement("strong");
            b.textContent = label + ": ";
            line.appendChild(b);
            line.appendChild(document.createTextNode(value));
            summary.appendChild(line);
        });

        document.getElementById("cal-google").href = ev.google;
        document.getElementById("cal-ics").onclick = () => downloadIcs(ev);

        document.getElementById("yes-title").textContent = "Жду нашей встречи! ❤️";
        document.getElementById("yes-gif").hidden = false;
        form.hidden = true;
        document.getElementById("plan-done").hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
})();
