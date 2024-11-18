# 인공지능사관학교_핵심 프로젝트
인공지능사관학교에서 주관하는 핵심프로젝트에서 사용한 코드입니다.
## 👨‍🏫 프로젝트 소개
"온라인게임에서 활용하는 ELO 레이팅을 접목한 풋살 매칭 웹 서비스입니다. 사용자들이 공정하고 재미있는 풋살 경기를 즐길 수 있도록 도와주는 웹서비스를 제작해보았습니다. 

## ⏲️ 개발 기간 
- 2024.07.19 ~ 2024.08.02
  
## 🧑‍🤝‍🧑 개발자 소개 
- **유승재** : 팀장, Front
- **김강현** : Back, DB
- **변지원** : Back, DB
- **양준호** : Back, DB
- **정인지** : UX UI Designer
  
![image](https://github.com/user-attachments/assets/6878d1b3-8ab1-4ada-841d-ea647ba9059b)


##  💻사용기술
### 1. Front
> ![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=HTML5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=CSS3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Javascript-F7DF1E?style=for-the-badge&logo=Javascript&logoColor=white)

### 2. Back
> ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

### 3. Etc
> ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

## 📌 주요 기능
- ELO 레이팅
  - 바닐라 JavaScript로 체스 레이팅 시스템으로 유명한 Elo 알고리즘을 구현하여, 사용자 간의 대결 결과에 따라 실시간으로 점수를 계산하고 업데이트하는 로직을 개발.
  - 외부 라이브러리 없이 순수 JavaScript만으로 예상 승률 계산, 새로운 레이팅 산출 등의 핵심 기능을 클래스 기반으로 모듈화하여 구현.

- 채팅 기능
   - websockets를 이용하여 사용자들끼리 실시간으로 채팅 기능이 가능하도록 구현.

- 밸런스 매칭 기능
  - 10명의 참가자들의 개인 레이팅 점수를 기반으로, 두 팀의 평균 레이팅 차이가 최소화되도록 팀 매칭을 구현, 모든 가능한 팀 조합을 계산하여 가장 균형 잡힌 매칭을 찾는 알고리즘을 라우터로 구현.

- 구장 예약 기능
    - DB와 연동하여 코트별 운영시간과 기존 예약 현황을 확인하요 중복 없는 예약이 가능하도록 개발.
    - 사용자가 선택한 구장, 코트, 날찌, 시간에 대한 예약정보를 DB에 저장하고 실시간으로 예약현황을 조회할 수 있도록 구현.

- 관리자 기능
  - 체육시설 운영자가 예약을 관리하고 경기 결과를 입력할 수 있는 관리자 시스템을 구현.
  - 경기 결과에 따라 참가자들의 레이팅이 자동으로 업데이트되고, 새로운 레이팅에 따라 리그/군이 실시간으로 조정되는 기능을 개발.
