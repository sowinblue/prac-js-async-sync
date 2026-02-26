const POKEMON_BASE_URL = "https://pokeapi.co/api/v2/pokemon/";

// ─────────────────────────────────────────────────────────────
// 공통 유틸
// ─────────────────────────────────────────────────────────────

// 콘솔 로그 헬퍼
// [경과시간ms] [섹션명] 메시지 형태로 흐름을 추적할 수 있다.
function log(section, message) {
    const elapsed = performance.now().toFixed(0);
    console.log(`[${elapsed}ms] [${section}] ${message}`);
}

// 공통 데이터 패치 함수
// setTimeout 800ms는 하드웨어가 빨라진 현대 환경에서
// 동기/비동기 차이를 눈으로 볼 수 있도록 의도적으로 추가한 지연이다.
// 내부 흐름: setTimeout → Macrotask Queue 대기
//            fetch 완료 → Promise resolve → Microtask Queue 처리
async function getPokemon(name, section = "COMMON") {
    log(section, `요청 시작: ${name}`);

    // [Macrotask] setTimeout이 Web API에 등록됨 → 800ms 후 콜백이 Macrotask Queue에 추가됨
    await new Promise(resolve => setTimeout(resolve, 800));
    log(section, `지연 완료 (800ms): ${name}`);

    // [Web API → Microtask] fetch가 Web API에서 처리됨 → 완료 시 Promise resolve → Microtask Queue
    const res = await fetch(`${POKEMON_BASE_URL}${name}`);

    if (!res.ok) {
        // HTTP 에러(404 등)는 fetch가 reject하지 않으므로 직접 throw해야 한다.
        // → 이 throw가 Promise를 reject 상태로 만든다.
        log(section, `❌ fetch 실패: ${name} (status: ${res.status})`);
        throw new Error(`Not found: ${name} (HTTP ${res.status})`);
    }

    const data = await res.json();
    log(section, `✅ 데이터 도착: ${name}`);
    return { name: data.name, image: data.sprites.front_default };
}


// ─────────────────────────────────────────────────────────────
// 1. SYNC 섹션: 피카츄 가족 — 순차 처리 (await for-loop)
// 핵심: 하나가 끝나야 다음이 시작된다. Call Stack이 await마다 비워지고,
//       Macrotask → Microtask 순서로 재개된다.
// ─────────────────────────────────────────────────────────────
async function runSyncRace() {
    const container = document.getElementById('sync-container');
    const timerDisplay = document.getElementById('sync-timer');
    const pikaFamily = ['pichu', 'pikachu', 'raichu'];

    container.innerHTML = '';
    const startTime = performance.now();
    timerDisplay.innerText = "Running...";

    log("SYNC", "===== 시작 =====");
    log("SYNC", "빈 카드 3개 생성 (동기)");

    // 빈 카드를 먼저 렌더링 → await 중에도 UI는 살아있다
    const cards = pikaFamily.map(() => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="loader"></div>`;
        container.appendChild(card);
        return card;
    });

    // 순서 보장 — i=0 완료 전까지 i=1은 절대 시작하지 않는다
    for (let i = 0; i < pikaFamily.length; i++) {
        log("SYNC", `[${i}] await 시작 → Call Stack 일시 중단`);
        const data = await getPokemon(pikaFamily[i], "SYNC");
        const currentTime = ((performance.now() - startTime) / 1000).toFixed(2);
        log("SYNC", `[${i}] await 재개 → 카드 렌더링`);

        cards[i].innerHTML = `
            <img src="${data.image}" alt="${data.name}">
            <p><strong>${data.name.toUpperCase()}</strong></p>
            <p style="color: #1a6bbf; font-size: 0.75rem;">Loaded at: ${currentTime}s</p>
        `;
    }

    const total = ((performance.now() - startTime) / 1000).toFixed(2);
    log("SYNC", `===== 완료: ${total}s =====`);
    timerDisplay.innerText = `Total: ${total}s`;
}


// ─────────────────────────────────────────────────────────────
// 2. ASYNC 섹션: 이상해씨 가족 — 병렬 처리 (Promise.all)
// 핵심: map()이 동기적으로 순회하며 async 함수를 즉시 호출
//       → 3개의 Promise가 거의 동시에 시작됨
//       → Promise.all이 전부 resolve될 때까지 기다림
// ─────────────────────────────────────────────────────────────
async function runAsyncRace() {
    const container = document.getElementById('async-container');
    const timerDisplay = document.getElementById('async-timer');
    const bulbaFamily = ['bulbasaur', 'ivysaur', 'venusaur'];

    container.innerHTML = '';
    const startTime = performance.now();
    timerDisplay.innerText = "Running...";

    log("ASYNC", "===== 시작 =====");

    // map()은 동기 루프 → async 함수를 즉시 호출 → Promise 배열 반환
    // 이 시점에 3개의 getPokemon()이 이미 실행 중이다
    const promises = bulbaFamily.map(async (name) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="loader"></div>`;
        container.appendChild(card);

        log("ASYNC", `병렬 요청 발사: ${name}`);
        const data = await getPokemon(name, "ASYNC");
        const currentTime = ((performance.now() - startTime) / 1000).toFixed(2);

        card.innerHTML = `
            <img src="${data.image}" alt="${data.name}">
            <p><strong>${data.name.toUpperCase()}</strong></p>
            <p style="color: #1a8a3a; font-size: 0.75rem;">Loaded at: ${currentTime}s</p>
        `;
        return data;
    });

    log("ASYNC", "Promise.all 대기 중 — 3개 중 가장 느린 것이 기준");
    await Promise.all(promises);

    const total = ((performance.now() - startTime) / 1000).toFixed(2);
    log("ASYNC", `===== 완료: ${total}s =====`);
    timerDisplay.innerText = `Total: ${total}s`;
}


// ─────────────────────────────────────────────────────────────
// 3. ERROR HANDLING 섹션: 파이리 가족 — Promise.all vs allSettled
//
// charmeleon 자리에 가짜 이름(fakemon)을 넣어 의도적으로 실패를 유발한다.
//
// Promise.all   → "전부 아니면 전무(All or Nothing)"
//                 하나라도 reject되면 나머지 결과를 버리고 catch로 떨어진다.
//
// Promise.allSettled → "각자 처리(Best Effort)"
//                      reject된 항목은 { status: 'rejected', reason } 으로 반환
//                      성공한 항목은 { status: 'fulfilled', value } 로 반환
//                      전체가 항상 완료된다.
// ─────────────────────────────────────────────────────────────
async function runErrorHandling() {
    const allContainer    = document.getElementById('all-container');
    const settledContainer = document.getElementById('settled-container');
    const allStatus       = document.getElementById('all-status');
    const settledStatus   = document.getElementById('settled-status');

    // 리자드(charmeleon) 자리에 가짜 이름 삽입 → 중간에서 실패
    const charFamily = ['charmander', 'fakemon-charmeleon', 'charizard'];

    allContainer.innerHTML = '';
    settledContainer.innerHTML = '';
    allStatus.innerText = 'Running...';
    settledStatus.innerText = 'Running...';

    // ── 3-A. Promise.all ──────────────────────────────────────
    log("ALL", "===== 시작 (중간 실패 예정) =====");

    const allPromises = charFamily.map(name => {
        const card = document.createElement('div');
        card.className = 'card card--loading';
        card.innerHTML = `<div class="loader"></div><p class="card-name">${name}</p>`;
        allContainer.appendChild(card);
        return getPokemon(name, "ALL");
    });

    try {
        // fakemon이 reject되는 순간 Promise.all 전체가 catch로 떨어진다.
        // charmander, charizard가 resolve됐더라도 결과는 버려진다.
        const results = await Promise.all(allPromises);

        results.forEach(data => {
            log("ALL", `렌더링: ${data.name} (이 로그는 보이지 않는다)`);
        });
        allStatus.innerText = '✅ 전체 성공';

    } catch (err) {
        // 실패한 하나 때문에 전체가 여기로 떨어진다
        log("ALL", `❌ Promise.all catch: ${err.message}`);
        log("ALL", "charmander, charizard 결과도 사라짐");

        // 카드 전체를 에러 상태로 표시
        allContainer.querySelectorAll('.card').forEach(card => {
            card.className = 'card card--error';
            card.innerHTML = `
                <p style="font-size: 1.5rem;">💥</p>
                <p style="font-size: 0.75rem; color: #c00;">Promise.all 실패</p>
                <p style="font-size: 0.65rem; color: #999;">성공한 결과도 버려짐</p>
            `;
        });
        allStatus.innerText = `❌ 실패: ${err.message}`;
    }

    // ── 3-B. Promise.allSettled ───────────────────────────────
    log("SETTLED", "===== 시작 (같은 데이터, 다른 처리) =====");

    const settledPromises = charFamily.map(name => {
        const card = document.createElement('div');
        card.className = 'card card--loading';
        card.innerHTML = `<div class="loader"></div><p class="card-name">${name}</p>`;
        settledContainer.appendChild(card);
        return getPokemon(name, "SETTLED");
    });

    const cards = settledContainer.querySelectorAll('.card');

    // allSettled는 reject가 있어도 catch로 떨어지지 않는다.
    // 모든 Promise가 완료(fulfilled or rejected)되면 결과 배열을 반환한다.
    const results = await Promise.allSettled(settledPromises);

    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            const data = result.value;
            log("SETTLED", `✅ fulfilled: ${data.name}`);
            cards[i].className = 'card card--success';
            cards[i].innerHTML = `
                <img src="${data.image}" alt="${data.name}">
                <p><strong>${data.name.toUpperCase()}</strong></p>
                <span class="badge badge--fulfilled">fulfilled</span>
            `;
        } else {
            // rejected여도 나머지 카드는 정상 렌더링된다
            log("SETTLED", `❌ rejected: ${result.reason.message}`);
            cards[i].className = 'card card--error';
            cards[i].innerHTML = `
                <p style="font-size: 1.5rem;">❓</p>
                <p style="font-size: 0.75rem; color: #c00;">${charFamily[i]}</p>
                <span class="badge badge--rejected">rejected</span>
                <p style="font-size: 0.65rem; color: #999; margin-top: 4px;">${result.reason.message}</p>
            `;
        }
    });

    settledStatus.innerText = '✅ allSettled 완료 (성공/실패 각자 처리)';
    log("SETTLED", "===== 완료 — 성공한 포켓몬은 살아있다 =====");
}


// ─────────────────────────────────────────────────────────────
// 이벤트 바인딩
// ─────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
    console.clear();
    log("MAIN", "▶ START — 콘솔에서 각 섹션의 흐름을 확인하세요");
    runSyncRace();
    runAsyncRace();
});

document.getElementById('error-btn').addEventListener('click', () => {
    console.clear();
    log("MAIN", "▶ ERROR HANDLING — Promise.all vs allSettled");
    runErrorHandling();
});