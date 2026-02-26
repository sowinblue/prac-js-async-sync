

프로젝트 목표: 

    1. pokeAPI와 동기/비동기 기술을 적절히 적용한 다양한 작업물

    2. 모든 팀원의 ai를 사용하지 않고도 비동기/동기를 손 코드로 핸들링할 수 있을 정도의 연구 지식 함양.


3️⃣ 코드 리뷰 세션

    누가 더 깔끔한가?

    에러 처리 어떻게 했나?

    await 위치 왜 저기인가?

    Promise.all 안 쓰고 왜 map 썼나?


----------------------------------------------------------

추가사항: yejin -> finalyejin

1. 콘솔 로그용 함수 하나가 추가되었습니다.
function log(section, message) {
    const time = performance.now().toFixed(0);
    console.log(`[${time}ms] [${section}] ${message}`);
}

2. Promise.all과 Promise.allSettled의 에러 핸들링 섹션이 추가되었습니다.
- 에러 핸들링 버튼은 기존 RACE START! 버튼의 오른쪽
- 결과는 기존 RACE 섹션(피카츄, 이상해씨) 아래에서 확인할 수 있습니다.