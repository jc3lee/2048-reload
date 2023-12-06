"use client";
import { useState, useEffect, useRef } from "react";
import { animated, useSprings } from "react-spring";
import { useGesture } from "@use-gesture/react";
import Image from "next/image";
import { z } from "zod";

const numberSchema = z.coerce.number();

type TypeItem = {
  value: number;
  x: number;
  y: number;
  back: string;
  nbInArr: number;
  zIndex: number;
  appeared: boolean;
  bounce: boolean;
};
type TypeItems = TypeItem[];

const TILE_SIDE = 75;

const nbArrDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const Game2048 = () => {
  const backArr = [
    "#ffffff",
    "#eee4db",
    "#eedfc8",
    "#f2b179",
    "#ec8d55",
    "#f57c5f",
    "#ea5a38",
    "#edce73",
    "#f2d04b",
    "#efc654",
    "#e3ba14",
    "#efc233",
    "#ed666b",
    "#000000",
  ];

  const winRef = useRef<HTMLDivElement>(null);
  const gameOverRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLParagraphElement>(null);
  const highscoreRef = useRef<HTMLParagraphElement>(null);
  let totalScore = 0;
  let [reached2048, setReached2048] = useState(false);
  let [continueGame, setContinueGame] = useState(true);

  let prevTotalScoreArr: number[] = [];

  let gameOver = false;

  let prevItemsArr: TypeItems[] = [];

  let didUndo = false;

  const showWin = () => {
    if (winRef.current?.classList) winRef.current.classList.add("showWin");
  };

  const hideWin = () => {
    if (winRef.current?.classList.contains("showWin"))
      winRef.current.classList.remove("showWin");
  };

  const showGameOver = () => {
    if (gameOverRef.current?.classList)
      gameOverRef.current.classList.add("showGameOver");
  };

  const hideGameOver = () => {
    if (gameOverRef.current?.classList.contains("showGameOver"))
      gameOverRef.current.classList.remove("showGameOver");
  };
  if (reached2048) showWin();
  if (!continueGame) {
    gameOver = true;
    showWin();
  }

  const getBack = (value: number) => {
    switch (value) {
      case 0:
        return backArr[0];
      case 2:
        return backArr[1];
      case 4:
        return backArr[2];
      case 8:
        return backArr[3];
      case 16:
        return backArr[4];
      case 32:
        return backArr[5];
      case 64:
        return backArr[6];
      case 128:
        return backArr[7];
      case 256:
        return backArr[8];
      case 512:
        return backArr[9];
      case 1024:
        return backArr[10];
      case 2048:
        return backArr[11];
      case 4096:
        return backArr[12];
      default:
        return backArr[13];
    }
  };

  const nbArrayXY = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
  ];

  let items: TypeItems = [];

  const initItems = () => {
    //adding 17 items not 16 bc recycle doesn't act after moving so need one extra tile
    for (let i = 0; i < 17; i++) {
      items[i] = {
        value: 0,
        x: 0,
        y: 0,
        back: backArr[0],
        nbInArr: -1,
        zIndex: 1001,
        appeared: false,
        bounce: false,
      };
    }
  };

  initItems();

  const getRandNb = (max: number) => Math.floor(Math.random() * max);
  //probability of getting a 2 = 90%, and a 4 = 10%
  const getNewNb = () => (Math.random() < 0.9 ? 2 : 4);

  const findZeroValueIndex = () => items.findIndex((i) => i.value === 0);

  const updateItem = (
    itemIndex: number,
    value: number,
    back: string,
    nbInArr: number,
    zIndex: number,
    keepXY = false
  ) => {
    items[itemIndex].value = value;
    if (!keepXY) {
      if (nbInArr < 0) {
        items[itemIndex].x = 0;
        items[itemIndex].y = 0;
      } else {
        items[itemIndex].x = nbArrayXY[nbInArr].x * TILE_SIDE;
        items[itemIndex].y = nbArrayXY[nbInArr].y * TILE_SIDE;
      }
    }
    items[itemIndex].back = back;
    items[itemIndex].nbInArr = nbInArr;
    items[itemIndex].zIndex = zIndex;
    items[itemIndex].appeared = false;
    items[itemIndex].bounce = false;
  };

  const recycleItems = () => {
    while (true) {
      const itemIndex = items.findIndex((i) => i.zIndex !== 1001);
      if (itemIndex === -1) break;
      updateItem(itemIndex, 0, backArr[0], -1, 1001, true);
    }
  };

  const updateItemAnimationState = () => {
    for (let item of items) {
      //update item appeared
      item.appeared = item.nbInArr !== -1 || item.zIndex !== 1001;
      item.bounce = false;
    }
  };

  const moveLeft = () => {
    let canMove = false;
    //loop through
    for (let colNb = 0; colNb < 16; colNb += 4) {
      //add an alreadyAdded boolean
      let leftItem: TypeItem | undefined,
        alreadyAdded = false;
      for (let nbInArr = colNb; nbInArr < 4 + colNb; nbInArr++) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!leftItem) {
          //nothing to compare against => move it to the utmost left
          if (item.x !== 0) {
            //update canMove to true
            canMove = true;
            item.x = 0;
          } else {
            //can't move
          }
          //also update nbInArr to the utmost left
          item.nbInArr = colNb;
          //and set it as leftItem
          leftItem = item;
        } else {
          if (alreadyAdded) {
            //move item next to leftItem
            if (item.x !== leftItem.x + TILE_SIDE) {
              //update canMove to true
              canMove = true;
              item.x = leftItem.x + TILE_SIDE;
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = leftItem.nbInArr + 1;
            //reset alreadyAdded to false
            alreadyAdded = false;
            //switch leftItem to current item
            leftItem = item;
          } else {
            //compare leftItem with item
            if (leftItem.value === item.value) {
              //same value
              //move item to leftItem
              //update canMove to true bc if same value obviously can move
              canMove = true;
              item.x = leftItem.x;
              //also update nbInArr to -1 to get it out of the array
              item.nbInArr = -1;
              //decrease item zIndex so that item slides below leftItem also to prepare it to recycle
              item.zIndex--;
              //updating the leftItem won't be reflected in items => find item in items to update
              const itemToUpdate = items.find(
                (i) => i.nbInArr === leftItem?.nbInArr
              );
              if (!itemToUpdate)
                throw new Error("Couldn't find item to update");
              //update value
              itemToUpdate.value *= 2;
              //update back too
              itemToUpdate.back = getBack(itemToUpdate.value);
              //update bounce too
              itemToUpdate.bounce = true;
              //update score too
              totalScore += itemToUpdate.value;
              //check if has reached 2048
              setReached2048(itemToUpdate.value === 2048);
              // console.log("updated bounce", itemToUpdate)
              //change alreadyAdded to true to prevent adding to it
              alreadyAdded = true;
              //don't switch leftItem to current item!!!
            } else {
              //different value
              //move item next to leftItem
              if (item.x !== leftItem.x + TILE_SIDE) {
                //update canMove to true only if item not sticking to leftItem
                canMove = true;
                item.x = leftItem.x + TILE_SIDE;
              } else {
                //can't move
              }
              //also update nbInArr
              item.nbInArr = leftItem.nbInArr + 1;
              //change alreadyAdded to false to allow adding to it
              alreadyAdded = false;
              //switch leftItem to current item
              leftItem = item;
            }
          }
          continue;
        }
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const moveRight = () => {
    let canMove = false;
    //loop through
    for (let colNb = 3; colNb < 16; colNb += 4) {
      //add an alreadyAdded boolean
      let rightItem: TypeItem | undefined,
        alreadyAdded = false;
      for (let nbInArr = colNb; nbInArr > -4 + colNb; nbInArr--) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!rightItem) {
          //nothing to compare against => move it to the utmost right
          if (item.x !== 3 * TILE_SIDE) {
            //update canMove to true
            canMove = true;
            item.x = 3 * TILE_SIDE;
          } else {
            //can't move
          }
          //also update nbInArr to the utmost right
          item.nbInArr = colNb;
          //and set it as rightItem
          rightItem = item;
        } else {
          if (alreadyAdded) {
            //move item next to rightItem
            if (item.x !== rightItem.x - TILE_SIDE) {
              //update canMove to true
              canMove = true;
              item.x = rightItem.x - TILE_SIDE;
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = rightItem.nbInArr - 1;
            //reset alreadyAdded to false
            alreadyAdded = false;
            //switch rightItem to current item
            rightItem = item;
          } else {
            //compare rightItem with item
            if (rightItem.value === item.value) {
              //same value
              //move item to rightItem
              //update canMove to true bc if same value obviously can move
              canMove = true;
              item.x = rightItem.x;
              //also update nbInArr to -1 to get it out of the array
              item.nbInArr = -1;
              //decrease item zIndex so that item slides below rightItem also to prepare it to recycle
              item.zIndex--;
              //updating the rightItem won't be reflected in items => find item in items to update
              const itemToUpdate = items.find(
                (i) => i.nbInArr === rightItem?.nbInArr
              );
              if (!itemToUpdate)
                throw new Error("Couldn't find item to update");
              //update value
              itemToUpdate.value *= 2;
              //update back too
              itemToUpdate.back = getBack(itemToUpdate.value);
              //update bounce too
              itemToUpdate.bounce = true;
              //update score too
              totalScore += itemToUpdate.value;
              //check if has reached 2048
              setReached2048(itemToUpdate.value === 2048);
              // console.log("updated bounce", itemToUpdate)
              //change alreadyAdded to true to prevent adding to it
              alreadyAdded = true;
              //don't switch rightItem to current item!!!
            } else {
              //different value
              //move item next to rightItem
              if (item.x !== rightItem.x - TILE_SIDE) {
                //update canMove to true only if item not sticking to rightItem
                canMove = true;
                item.x = rightItem.x - TILE_SIDE;
              } else {
                //can't move
              }
              //also update nbInArr
              item.nbInArr = rightItem.nbInArr - 1;
              //change alreadyAdded to false to allow adding to it
              alreadyAdded = false;
              //switch rightItem to current item
              rightItem = item;
            }
          }
          continue;
        }
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const moveTop = () => {
    let canMove = false;
    //loop through
    for (let rowNb = 0; rowNb < 4; rowNb++) {
      //add an alreadyAdded boolean
      let topItem: TypeItem | undefined,
        alreadyAdded = false;
      for (let nbInArr = rowNb; nbInArr < 16; nbInArr += 4) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!topItem) {
          //nothing to compare against => move it to the utmost top
          if (item.y !== 0) {
            //update canMove to true
            canMove = true;
            item.y = 0;
          } else {
            //can't move
          }
          //also update nbInArr to the utmost top
          item.nbInArr = rowNb;
          //and set it as topItem
          topItem = item;
        } else {
          if (alreadyAdded) {
            //move item next to topItem
            if (item.y !== topItem.y + TILE_SIDE) {
              //update canMove to true
              canMove = true;
              item.y = topItem.y + TILE_SIDE;
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = topItem.nbInArr + 4;
            //reset alreadyAdded to false
            alreadyAdded = false;
            //switch topItem to current item
            topItem = item;
          } else {
            //compare topItem with item
            if (topItem.value === item.value) {
              //same value
              //move item to topItem
              //update canMove to true bc if same value obviously can move
              canMove = true;
              item.y = topItem.y;
              //also update nbInArr to -1 to get it out of the array
              item.nbInArr = -1;
              //decrease item zIndex so that item slides below topItem also to prepare it to recycle
              item.zIndex--;
              //updating the topItem won't be reflected in items => find item in items to update
              const itemToUpdate = items.find(
                (i) => i.nbInArr === topItem?.nbInArr
              );
              if (!itemToUpdate)
                throw new Error("Couldn't find item to update");
              //update value
              itemToUpdate.value *= 2;
              //update back too
              itemToUpdate.back = getBack(itemToUpdate.value);
              //update bounce too
              itemToUpdate.bounce = true;
              //update score too
              totalScore += itemToUpdate.value;
              //check if has reached 2048
              setReached2048(itemToUpdate.value === 2048);
              // console.log("updated bounce", itemToUpdate)
              //change alreadyAdded to true to prevent adding to it
              alreadyAdded = true;
              //don't switch topItem to current item!!!
            } else {
              //different value
              //move item next to topItem
              if (item.y !== topItem.y + TILE_SIDE) {
                //update canMove to true only if item not sticking to topItem
                canMove = true;
                item.y = topItem.y + TILE_SIDE;
              } else {
                //can't move
              }
              //also update nbInArr
              item.nbInArr = topItem.nbInArr + 4;
              //change alreadyAdded to false to allow adding to it
              alreadyAdded = false;
              //switch topItem to current item
              topItem = item;
            }
          }
          continue;
        }
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const moveBtm = () => {
    let canMove = false;
    //loop through
    for (let rowNb = 12; rowNb < 16; rowNb++) {
      //add an alreadyAdded boolean
      let btmItem: TypeItem | undefined,
        alreadyAdded = false;
      for (let nbInArr = rowNb; nbInArr > -1; nbInArr -= 4) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!btmItem) {
          //nothing to compare against => move it to the utmost btm
          if (item.y !== 3 * TILE_SIDE) {
            //update canMove to true
            canMove = true;
            item.y = 3 * TILE_SIDE;
          } else {
            //can't move
          }
          //also update nbInArr to the utmost btm
          item.nbInArr = rowNb;
          //and set it as btmItem
          btmItem = item;
        } else {
          if (alreadyAdded) {
            //move item next to btmItem
            if (item.y !== btmItem.y - TILE_SIDE) {
              //update canMove to true
              canMove = true;
              item.y = btmItem.y - TILE_SIDE;
            } else {
              //can't move
            }
            //also update nbInArr
            item.nbInArr = btmItem.nbInArr - 4;
            //reset alreadyAdded to false
            alreadyAdded = false;
            //switch btmItem to current item
            btmItem = item;
          } else {
            //compare btmItem with item
            if (btmItem.value === item.value) {
              //same value
              //move item to btmItem
              //update canMove to true bc if same value obviously can move
              canMove = true;
              item.y = btmItem.y;
              //also update nbInArr to -1 to get it out of the array
              item.nbInArr = -1;
              //decrease item zIndex so that item slides below btmItem also to prepare it to recycle
              item.zIndex--;
              //updating the btmItem won't be reflected in items => find item in items to update
              const itemToUpdate = items.find(
                (i) => i.nbInArr === btmItem?.nbInArr
              );
              if (!itemToUpdate)
                throw new Error("Couldn't find item to update");
              //update value
              itemToUpdate.value *= 2;
              //update back too
              itemToUpdate.back = getBack(itemToUpdate.value);
              //update bounce too
              itemToUpdate.bounce = true;
              //update score too
              totalScore += itemToUpdate.value;
              //check if has reached 2048
              setReached2048(itemToUpdate.value === 2048);
              // console.log("updated bounce", itemToUpdate)
              //change alreadyAdded to true to prevent adding to it
              alreadyAdded = true;
              //don't switch btmItem to current item!!!
            } else {
              //different value
              //move item next to btmItem
              if (item.y !== btmItem.y - TILE_SIDE) {
                //update canMove to true only if item not sticking to btmItem
                canMove = true;
                item.y = btmItem.y - TILE_SIDE;
              } else {
                //can't move
              }
              //also update nbInArr
              item.nbInArr = btmItem.nbInArr - 4;
              //change alreadyAdded to false to allow adding to it
              alreadyAdded = false;
              //switch topItem to current item
              btmItem = item;
            }
          }
          continue;
        }
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const addItem = () => {
    //check empty spots
    //get all the filled spots in an Arr
    const filledSpotsArr: number[] = [];
    for (let item of items) {
      const { nbInArr } = item;
      if (nbInArr !== -1) filledSpotsArr[filledSpotsArr.length] = nbInArr;
    }
    const remainingSpots = nbArrDefault.filter(
      (nb) => !filledSpotsArr.includes(nb)
    );
    // console.log("remaining spots", remainingSpots)
    const randNb = getRandNb(remainingSpots.length);
    // console.log("randNb", randNb, "spot", remainingSpots[randNb])
    let i1 = findZeroValueIndex();
    let randValue = getNewNb();
    updateItem(i1, randValue, getBack(randValue), remainingSpots[randNb], 1001);
  };

  const checkForGameOver = () => {
    if (checkLeft() || checkBtm() || checkRight() || checkTop()) {
      return false;
    } else {
      return true;
    }
  };

  const checkLeft = () => {
    let canMove = false;
    //loop through
    for (let colNb = 0; colNb < 16; colNb += 4) {
      //add an alreadyAdded boolean
      let leftItem;
      for (let nbInArr = colNb; nbInArr < 4 + colNb; nbInArr++) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!leftItem) {
          //nothing to compare against => move it to the utmost left
          if (item.x !== 0) {
            //update canMove to true
            canMove = true;
            return canMove;
          } else {
            //can't move
          }
          leftItem = item;
        } else {
          //compare leftItem with item
          if (leftItem.value === item.value) {
            //same value
            //move item to leftItem
            //update canMove to true bc if same value obviously can move
            canMove = true;
            return canMove;
          } else {
            //different value
            //move item next to leftItem
            if (item.x !== leftItem.x + TILE_SIDE) {
              //update canMove to true only if item not sticking to leftItem
              canMove = true;
              return canMove;
            } else {
              //can't move
            }
            //switch leftItem to current item
            leftItem = item;
          }
        }
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const checkRight = () => {
    let canMove = false;
    //loop through
    for (let colNb = 3; colNb < 16; colNb += 4) {
      //add an alreadyAdded boolean
      let rightItem;
      for (let nbInArr = colNb; nbInArr > -4 + colNb; nbInArr--) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!rightItem) {
          //nothing to compare against => move it to the utmost right
          if (item.x !== 3 * TILE_SIDE) {
            //update canMove to true
            canMove = true;
            return canMove;
          } else {
            //can't move
          }
          rightItem = item;
        } else {
          //compare rightItem with item
          if (rightItem.value === item.value) {
            //same value
            //move item to rightItem
            //update canMove to true bc if same value obviously can move
            canMove = true;
            return canMove;
          } else {
            //different value
            //move item next to rightItem
            if (item.x !== rightItem.x - TILE_SIDE) {
              //update canMove to true only if item not sticking to rightItem
              canMove = true;
              return canMove;
            } else {
              //can't move
            }
            rightItem = item;
          }
        }
        continue;
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const checkTop = () => {
    let canMove = false;
    //loop through
    for (let rowNb = 0; rowNb < 4; rowNb++) {
      //add an alreadyAdded boolean
      let topItem;
      for (let nbInArr = rowNb; nbInArr < 16; nbInArr += 4) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!topItem) {
          //nothing to compare against => move it to the utmost top
          if (item.y !== 0) {
            //update canMove to true
            canMove = true;
            return canMove;
          } else {
            //can't move
          }
          //and set it as topItem
          topItem = item;
        } else {
          //compare topItem with item
          if (topItem.value === item.value) {
            //same value
            //move item to topItem
            //update canMove to true bc if same value obviously can move
            canMove = true;
            return canMove;
          } else {
            //different value
            //move item next to topItem
            if (item.y !== topItem.y + TILE_SIDE) {
              //update canMove to true only if item not sticking to topItem
              canMove = true;
              return canMove;
            } else {
              //can't move
            }
            topItem = item;
          }
        }
        continue;
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const checkBtm = () => {
    let canMove = false;
    //loop through
    for (let rowNb = 12; rowNb < 16; rowNb++) {
      //add an alreadyAdded boolean
      let btmItem;
      for (let nbInArr = rowNb; nbInArr > -1; nbInArr -= 4) {
        const item = items.find((i) => i.nbInArr === nbInArr);
        if (!item) continue;
        if (!btmItem) {
          //nothing to compare against => move it to the utmost btm
          if (item.y !== 3 * TILE_SIDE) {
            //update canMove to true
            canMove = true;
            return canMove;
          } else {
            //can't move
          }
          btmItem = item;
        } else {
          //compare btmItem with item
          if (btmItem.value === item.value) {
            //same value
            //move item to btmItem
            //update canMove to true bc if same value obviously can move
            canMove = true;
            return canMove;
          } else {
            //different value
            //move item next to btmItem
            if (item.y !== btmItem.y - TILE_SIDE) {
              //update canMove to true only if item not sticking to btmItem
              canMove = true;
              return canMove;
            } else {
              //can't move
            }
            //switch topItem to current item
            btmItem = item;
          }
        }
        continue;
      }
    }
    // console.log("items af", items)
    return canMove;
  };

  const addInitialTwoTiles = () => {
    let rd1 = 0,
      rd2 = 0;
    do {
      rd1 = getRandNb(16);
      rd2 = getRandNb(16);
    } while (rd1 === rd2);
    let i1 = findZeroValueIndex();
    let randValue1 = getNewNb();
    updateItem(i1, randValue1, getBack(randValue1), rd1, 1001);
    let i2 = findZeroValueIndex();
    let randValue2 = getNewNb();
    updateItem(i2, randValue2, getBack(randValue2), rd2, 1001);
  };

  const bind = useGesture(
    {
      onDrag: ({ movement: [x, y], tap, cancel, down }) => {
        //do nothing when tapping, only detect drag
        if (tap) return;
        cancel();
      },
      onDragEnd: ({ movement: [x, y] }) => {
        // console.log(x, y)
        //detect whether mouse dragging left, right, top, btm
        if (Math.abs(x) > Math.abs(y)) {
          //left or right
          if (x > 0) {
            //right
            handleMove(2);
          } else {
            //left
            handleMove(0);
          }
        } else {
          //top or btm
          if (y > 0) {
            //btm
            handleMove(3);
          } else {
            //top
            handleMove(1);
          }
        }
      },
    },
    {
      drag: { filterTaps: true, threshold: 50 },
    }
  );

  const updateScore = () => {
    if (scoreRef.current?.innerText)
      scoreRef.current.innerText = `${totalScore}`;
    if (
      numberSchema.parse(window.localStorage?.getItem("highscore")) < totalScore
    ) {
      window.localStorage.setItem("highscore", `${totalScore}`);
      if (highscoreRef.current?.innerText)
        highscoreRef.current.innerText = `${totalScore}`;
    }
  };

  const [resetCounter, incrResetCounter] = useState(0);

  const [itemsProps, setItems] = useSprings(items.length, (index) => ({
    opacity: items[index].value ? 1 : 0,
    x: items[index].x,
    y: items[index].y,
    background: items[index].back,
    scale: items[index].value ? 1 : 0,
    value: items[index].value,
    zIndex: items[index].zIndex,
    color: items[index].value > 4 ? "white" : "black",
  }));

  useEffect(() => {
    initHighScore();
    initGame();
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [resetCounter]);

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        handleMove(0);
        break;
      case "ArrowUp":
        handleMove(1);
        break;
      case "ArrowRight":
        handleMove(2);
        break;
      case "ArrowDown":
        handleMove(3);
        break;
      default:
        console.log("key error", e.key);
    }
  };

  const updateStorage = () => {
    window.localStorage.setItem("totalScore", JSON.stringify(totalScore));
    window.localStorage.setItem("items", JSON.stringify(items));
  };

  const initGame = () => {
    let savedItemsJSON = window.localStorage.getItem("items");
    if (savedItemsJSON) {
      try {
        items = JSON.parse(savedItemsJSON);
        totalScore =
          numberSchema.parse(window.localStorage.getItem("totalScore")) || 0;
        if (totalScore) updateScore();
      } catch (err) {
        console.log("failed to parse saved items");
        window.localStorage.removeItem("items");
        window.localStorage.removeItem("totalScore");
        addInitialTwoTiles();
      }
    } else {
      addInitialTwoTiles();
    }
    setItems.start((index) => ({
      to: async (next) => {
        await next({
          opacity: items[index].value ? 1 : 0,
          x: items[index].x,
          y: items[index].y,
          background: items[index].back,
          zIndex: items[index].zIndex,
          value: items[index].value,
          color: items[index].value > 4 ? "white" : "black",
          immediate: true,
        });
        await next({
          scale: items[index].value ? 1 : 0,
        });
      },
    }));
    updateItemAnimationState();
    //keep this version in the prevItemsArr
    prevItemsArr.push(items.map((i) => Object.assign({}, i)));
    prevTotalScoreArr.push(totalScore);
  };

  const initHighScore = () => {
    if (highscoreRef.current?.innerText)
      highscoreRef.current.innerText =
        window.localStorage.getItem("highscore") || "0";
  };

  const resetGame = () => {
    hideWin();
    hideGameOver();
    //clean storage items
    window.localStorage.removeItem("items");
    //clean storage score
    window.localStorage.removeItem("totalScore");
    setItems.start((index) => ({
      to: async (next) => {
        await next({
          opacity: items[index].value ? 1 : 0,
          x: items[index].x,
          y: items[index].y,
          background: items[index].back,
          zIndex: items[index].zIndex,
          value: items[index].value,
          scale: 0,
          color: items[index].value > 4 ? "white" : "black",
          immediate: true,
        });
      },
    }));
    initItems();

    incrResetCounter(resetCounter + 1);
    //only for debug resetting high score
    // window.localStorage.setItem("highscore", 0)
    totalScore = 0;
    prevTotalScoreArr = [];
    prevItemsArr = [];
    updateScore();
    gameOver = false;
    didUndo = false;
    setReached2048(false);
    setContinueGame(true);
  };

  const handleUndo = () => {
    hideWin();
    hideGameOver();

    if (prevItemsArr.length < 2) return;
    if (didUndo) return;
    didUndo = true;
    items = prevItemsArr[prevItemsArr.length - 2];
    prevItemsArr.push(items.map((i) => Object.assign({}, i)));
    //reset score
    totalScore = prevTotalScoreArr[prevTotalScoreArr.length - 2];
    prevTotalScoreArr.push(totalScore);
    updateScore();
    setItems.start((index) => ({
      to: async (next) => {
        if (items[index].zIndex === 1000) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            zIndex: items[index].zIndex,
            value: items[index].value,
            color: items[index].value > 4 ? "white" : "black",

            immediate: true,
          });
          await next({
            x: items[index].x,
            y: items[index].y,
          });
          await next({
            opacity: 0,
            scale: 0,
            immediate: true,
          });
        } else if (items[index].appeared && items[index].bounce) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            immediate: true,
          });
          await next({
            x: items[index].x,
            y: items[index].y,
            scale: 1.1,
            config: { duration: 250 },
          });
          await next({
            scale: 1,
            config: { duration: 200 },
          });
        } else if (items[index].appeared) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            scale: items[index].value ? 1 : 0,
            immediate: true,
          });
          await next({
            x: items[index].x,
            y: items[index].y,
            config: { duration: 250 },
          });
        } else {
          await next({
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            x: items[index].x,
            y: items[index].y,
            scale: items[index].value ? 1 : 0,
            immediate: true,
          });
          await next({
            opacity: items[index].value ? 1 : 0,
            config: { duration: 250 },
          });
        }
      },
    }));
    if (gameOver) {
      gameOver = false;
    }
    updateStorage();
  };

  const handleMove = (direction: 0 | 1 | 2 | 3) => {
    if (gameOver) return;
    let canMove;
    switch (direction) {
      case 0:
        canMove = moveLeft();
        break;
      case 1:
        canMove = moveTop();
        break;
      case 2:
        canMove = moveRight();
        break;
      case 3:
        canMove = moveBtm();
        break;
      default:
        // console.log("canMove error")
        canMove = false;
    }
    // console.log("canMove", canMove)
    if (!canMove) return;
    didUndo = false;
    addItem();
    setItems.start((index) => ({
      to: async (next) => {
        if (items[index].zIndex === 1000) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            zIndex: items[index].zIndex,
            value: items[index].value,
            color: items[index].value > 4 ? "white" : "black",

            immediate: true,
          });
          await next({
            x: items[index].x,
            y: items[index].y,
            config: { duration: 200 },
          });
          await next({
            opacity: 0,
            scale: 0,
            immediate: true,
          });
        } else if (items[index].appeared && items[index].bounce) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            immediate: true,
          });
          await next({
            x: items[index].x,
            y: items[index].y,
            scale: 1.1,
            config: { duration: 200 },
          });
          await next({
            scale: 1,
            config: { duration: 100 },
          });
        } else if (items[index].appeared) {
          await next({
            opacity: items[index].value ? 1 : 0,
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            scale: items[index].value ? 1 : 0,
            immediate: true,
          });
          await next({
            x: items[index].x,
            y: items[index].y,
            config: { duration: 200 },
          });
        } else {
          await next({
            background: items[index].back,
            color: items[index].value > 4 ? "white" : "black",
            zIndex: items[index].zIndex,
            value: items[index].value,
            x: items[index].x,
            y: items[index].y,
            immediate: true,
          });
          await next({
            opacity: items[index].value ? 1 : 0,
            scale: items[index].value ? 1 : 0,
            config: { duration: 200 },
          });
        }
      },
    }));
    //updateScore
    updateScore();
    //recycle items that need reset, basically items with nbInArr = -1
    //recycling create animation bug need to recycle value but not x and y
    //update added keepXY
    updateItemAnimationState();
    recycleItems();
    gameOver = checkForGameOver();
    // // DEBUG
    // gameOver = true
    if (gameOver) {
      //show gameOver
      showGameOver();
      //clean storage items
      window.localStorage.removeItem("items");
      //clean storage score
      window.localStorage.removeItem("totalScore");
    }
    //keep this version in the prevItemsArr
    prevItemsArr.push(items.map((i) => Object.assign({}, i)));
    prevTotalScoreArr.push(totalScore);
    //update localStorage
    if (!gameOver) updateStorage();
  };

  const handleContinue = () => {
    setContinueGame(true);
    gameOver = false;
    hideWin();
  };

  return (
    <main className="w-full h-full flex flex-col">
      <div className="mt-[50px] mx-auto mb-0 w-[310px] topContainer">
        <div className="flex justify-end items-center topContainerTop mb-2">
          <h3 className="font-sans text-5xl mr-auto font-semibold text-[#bcada1] title">
            2048
          </h3>
          <div className="font-sans bg-[#bcada1] rounded-[4px] text-white flex flex-col flex-nowrap justify-center items-center py-1 px-2 mr-[10px] scoreBox">
            <p className="text-sm font-bold tracking-wider scoreHeaderText">
              SCORE
            </p>
            <p className="text-2xl font-bold score" ref={scoreRef}>
              0
            </p>
          </div>
          <div className="font-sans bg-[#bcada1] rounded-[4px] text-white flex flex-col flex-nowrap justify-center items-center py-1 px-2 highscoreBox">
            <p className="text-sm font-bold tracking-wider scoreHeaderText">
              HIGH SCORE
            </p>
            <p className="text-2xl font-bold score" ref={highscoreRef}>
              0
            </p>
          </div>
        </div>
      </div>

      <div className="w-full relative grow outerContainer">
        <animated.div
          {...bind()}
          className="absolute w-full h-full border border-red-500 mx-auto z-[2000] opacity-0 containerSwipe"
        />
        <div className="relative mx-auto w-[310px] h-[310px] container">
          <div className="absolute w-full h-full p-[5px] mx-auto grid rounded-[8px] gridContainerBack [&>*]:w-[65px] [&>*]:h-[65px] [&>*]:m-[5px] [&>*]:rounded">
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
            <div className="itemBack" />
          </div>
          <div className="absolute w-full h-full p-[5px] mx-auto grid bg-none rounded-[8px] gridContainer">
            {itemsProps.map((props, index) => {
              return (
                <animated.div
                  key={index}
                  className="absolute left-[5px] top-[5px] w-[65px] h-[65px] m-[5px] rounded flex justify-center items-center text-[1.6rem] font-semibold font-sans item"
                  style={{
                    x: props.x,
                    y: props.y,
                    scale: props.scale,
                    background: props.background,
                    opacity: props.opacity,
                    zIndex: props.zIndex,
                    color: props.color,
                  }}
                >
                  {props.value}
                </animated.div>
              );
            })}
          </div>
          <div
            ref={gameOverRef}
            className="absolute w-full h-full p-[5px] flex flex-col flex-nowrap justify-center items-center text-black font-sans rounded-[8px] mx-auto z-[-1000] opacity-0 containerGameOver"
          >
            <h1>Game Over!</h1>
          </div>
          <div
            ref={winRef}
            className="absolute w-full h-full p-[5px] flex flex-col flex-nowrap z-[-1000] opacity-0 justify-center mx-auto items-center text-black font-sans rounded-lg containerWin transition-all scale-150"
            onClick={handleContinue}
          >
            <h1>🎉 You win! 🎉</h1>
            <p className="mt-10 text-xl">Tap to continue</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center py-4 topContainerBtm [&>*]:text-[#eee] [&>*]:w-[35px][&>*]:h-[35px] [&>*]:rounded-[4px] [&>*]:border-none [&>*]:bg-[#bcada1] [&>*]:cursor-pointer [&>*]:flex [&>*]:justify-center [&>*]:items-center space-x-4">
        <button
          className="flex justify-center hover:opacity-[85] focus:opacity-[85] p-2 space-x-2 back"
          onClick={handleUndo}
        >
          <span className="font-bold text-xl text-white tracking-wide relative -top-0.5">
            Undo
          </span>
          <Image
            className="object-contain w-6 h-8 object-center "
            src="/icons/back.png"
            alt="back"
            width={18}
            height={18}
          />
        </button>
        <button
          className="flex justify-center hover:opacity-[85] focus:opacity-[85] reset p-2 space-x-2"
          onClick={resetGame}
        >
          <span className="font-bold text-xl text-white tracking-wide relative -top-0.5">
            Reset
          </span>
          <Image
            className="object-contain w-8 h-8 object-center "
            src="/icons/reset.png"
            alt="reset"
            width={18}
            height={18}
          />
        </button>
      </div>
      {/* <div className="mx-auto text-center max-w-[300px] controls">
        <button className="p-4" onClick={() => handleMove(0)}>
          Left
        </button>
        <button className="p-4" onClick={() => handleMove(1)}>
          Top
        </button>
        <button className="p-4" onClick={() => handleMove(2)}>
          Right
        </button>
        <button className="p-4" onClick={() => handleMove(3)}>
          Bottom
        </button>
      </div> */}
      <style jsx global>
        {`
          .containerSwipe {
            background: rgba(177, 136, 136, 0.5);
          }
          .containerGameOver {
            background: rgba(177, 136, 136, 0.5);
            transition: opacity 0.3s ease;
          }
          .showGameOver {
            z-index: 2048;
            opacity: 1;
          }
          .gridContainerBack {
            background: rgb(177, 136, 136);
            grid-template-columns: repeat(4, 1fr);
          }
          .itemBack {
            background: rgb(236, 206, 206);
          }

          .gridContainer {
            grid-template-columns: repeat(4, 1fr);
          }
          .containerWin {
            background: rgba(255, 205, 205, 0.6);
          }
          .showWin {
            z-index: 2048;
            opacity: 1;
            transform: scale(1, 1);
          }
        `}
      </style>
    </main>
  );
};

export default Game2048;
