
4일차 실습용 코드
=============
### 추가사항: yejin -> finalyejin
1. 콘솔 로그용 함수 하나가 추가되었습니다.

```JavaScript
    function log(section, message) {
        const time = performance.now().toFixed(0);
        console.log(`[${time}ms] [${section}] ${message}`);
    }
```

2. Promise.all과 Promise.allSettled의 에러 핸들링 섹션이 추가되었습니다.
    - 편집된 파일: index.html, app.js
    - 에러 핸들링 버튼은 기존 RACE START! 버튼의 오른쪽
    - 결과는 기존 RACE 섹션(피카츄, 이상해씨) 아래에서 확인할 수 있습니다.
