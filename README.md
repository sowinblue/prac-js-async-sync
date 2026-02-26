# ⚡ Pokemon Evolution Race

PokeAPI를 활용해 JavaScript의 **동기/비동기 처리 흐름**을 시각적으로 비교하는 학습용 데모입니다.

---

## 📌 이 코드를 만든 이유

기존 코드는 하드웨어 성능이 빠르게 향상되면서, 동기와 비동기 처리의 속도 차이가 사람의 눈으로는 거의 구분되지 않는 환경이 되었기에 **의도적으로 800ms 지연(setTimeout)을 추가**해 동기는 순서대로 하나씩, 비동기는 병렬로 동시에 처리되는 흐름을 시각화했습니다. 다만 이는 프로젝트 최종 목적인 동기 방식과 비동기 방식의 이해 및 연구라는 주제에서는 직관적인 흐름이 꼬여 이해관계가 헷갈릴 수 있다는 지점을 관찰하고 이를 개선하고자 했습니다.

에러 핸들링 부분은 팀장인 제가 개인적으로 잘 생각하지 못하는 부분이라, 이를 알고 함께 개선하고자 에러 핸들링 관련 기능을 추가하게 되었습니다.

---

## 🔧 기존 코드로부터 수정사항

### 1. 이벤트 루프 흐름 가시화 — `log()` 헬퍼 추가

**기존 문제**

코드가 동작하는 결과(카드 렌더링, 타이머)는 사람의 눈으로는 잘 가시화되었지만, 내부에서 어떤 순서로 실행되는지는 직관적으로 보이지 않았습니다. `setTimeout`이 왜 있는지, `await` 이후 코드가 언제 재개되는지 기존 코드로는 추적하기가 어렵다고 판단했습니다.

**변경 내용**

```js
function log(section, message) {
    const elapsed = performance.now().toFixed(0);
    console.log(`[${elapsed}ms] [${section}] ${message}`);
}
```

모든 비동기 전환 지점에 `log()`를 추가했습니다. 브라우저 콘솔(`F12 → Console`)을 열고 버튼을 누르면 아래와 같이 각 작업이 타임스탬프 순서로 출력됩니다.

```
[0ms]    [SYNC] ===== 시작 =====
[1ms]    [SYNC] [0] await 시작 → Call Stack 일시 중단
[1ms]    [ASYNC] 병렬 요청 발사: bulbasaur
[1ms]    [ASYNC] 병렬 요청 발사: ivysaur
[1ms]    [ASYNC] 병렬 요청 발사: venusaur
[801ms]  [SYNC] 지연 완료 (800ms): pichu
[803ms]  [ASYNC] 데이터 도착: bulbasaur
...
```

SYNC는 800ms 간격으로 순차 출력되고, ASYNC는 거의 동시에 시작해서 거의 동시에 끝나는 것을 숫자로 직접 확인할 수 있습니다.

---

### 2. Error Handling 섹션 추가 — `Promise.all` vs `Promise.allSettled`

**기존 문제**

`Promise.all`의 "전부 아니면 전무(All or Nothing)" 특성을 코드에서 체험할 방법이 없었습니다. 에러 핸들링이 없어서 fetch 실패 시 조용히 깨지는 구조였고, `Promise.all`과 `Promise.allSettled`의 차이도 다루지 않았습니다.

**변경 내용**

파이리 가족(`charmander`, `charmeleon`, `charizard`) 중 **리자드(charmeleon) 자리에 의도적으로 가짜 이름**을 넣어 중간 실패를 만들었습니다. 같은 데이터로 두 메서드의 동작 차이를 나란히 확인할 수 있습니다.

| | `Promise.all` | `Promise.allSettled` |
|---|---|---|
| 실패 시 동작 | 전체 `catch`로 떨어짐. 성공한 결과도 버려짐 | 성공/실패 각각 결과 반환. 나머지는 정상 렌더링 |
| 반환 형태 | 전체 성공 시 결과 배열 / 하나라도 실패 시 에러 | `{ status: 'fulfilled', value }` 또는 `{ status: 'rejected', reason }` |
| 언제 쓰는가 | 모든 요청이 반드시 성공해야 할 때 | 일부 실패해도 나머지를 처리해야 할 때 |

또한 `fetch`는 HTTP 404도 reject하지 않기 때문에 `res.ok` 체크 후 직접 `throw`하는 패턴을 추가했습니다.

```js
if (!res.ok) {
    throw new Error(`Not found: ${name} (HTTP ${res.status})`);
}
```

---

## 🗂️ 파일 구조

```
├── index.html   # UI 구조 및 스타일
└── app.js       # 비동기 로직 (Sync / Async / Error Handling)
```

## 🚀 실행 방법

별도 설치 없이 `index.html`을 브라우저에서 열면 바로 동작합니다.  
콘솔(`F12 → Console`)을 열어두고 버튼을 누르면 이벤트 루프 흐름을 함께 확인할 수 있습니다.