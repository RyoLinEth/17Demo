import './App.css';
import image from './assets/BNB_4.png'
import appImage from './assets/AppPic.png'
import black from './assets/black.png'
import bgimage from './assets/bg.jpg'
import bnbgif from './assets/bnb.gif'
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers'
import contractABI from './contractabi.json'
import { CopyToClipboard } from 'react-copy-to-clipboard';

const contractAddress = "0x356C885249B9b44846E5584C43A8cE5D33Ba2553";

function App() {
  /*
    自動獲取的參數
    refAccount  : 讀取網頁連結 所得到的推薦人地址
  */
  let refAccount;

  /*
    預先設定的參數
    defaultIDOAddress : 預設的IDO地址
  */

  const defaultIDOAddress = "0x60e21c1C75E60a966734B4Dd0FE1D3ac7484F00A";
  const [errorMessage, setErrorMessage] = useState(null);
  const [defaultAccount, setDefaultAccount] = useState(null)
  const [connectButtonText, setConnectButtonText] = useState('连接钱包')
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [father, setFather] = useState(null);
  const [ancestor, setAncestor] = useState(null);
  const [refLink, setRefLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [correctNetwork, setCorrectNetwork] = useState(null);

  const [hasJoin, setHasJoin] = useState("未参与");
  const [directReward, setDirectReward] = useState(0);
  const [indirectReward, setIndirectReward] = useState(0)
  const [whiteReward, setWhiteReward] = useState(0)
  const [autoInvestReward, setAutoInvestReward] = useState(0)

  const [web3Number, setWeb3Number] = useState(0)
  const [web3NumberNow, setWeb3NumberNow] = useState(0)

  async function changingAccount() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        connectWalletHandler()
      })
    }
  }

  useEffect(() => {
    changingAccount()
    setTimeout(
      async function () {
        await getReward()
      }, 1000)
  }, [defaultAccount])

  /*
    ==========================================
    ==========================================
    
      ***  Functions for All project   ***
    
    ==========================================
    ==========================================
  */
  const connectWalletHandler = async () => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(async (result) => {
          await accountChangeHandler(result[0]);
          setConnectButtonText(`${result[0].slice(0, 4)}...${result[0].slice(-4)}`);
        })
    } else {
      setErrorMessage('Need to install MetaMask!')
    }
  }

  //設定預設地址 以及 個人邀請連結
  const accountChangeHandler = async (newAccount) => {
    checkCorrectNetwork();
    setDefaultAccount(newAccount);
    window.sessionStorage.setItem('account', newAccount)
    let tempReflink = `https://17demo.pages.dev/invitedBy=${newAccount}`
    // let tempReflink = `localhost:3001/invitedBy=${newAccount}`
    setRefLink(tempReflink);

    await updateEthers();
  }

  const updateEthers = async () => {
    let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(tempProvider);

    let tempSigner = tempProvider.getSigner();
    setSigner(tempSigner);

    let tempContract = new ethers.Contract(contractAddress, contractABI, tempSigner)
    setContract(tempContract);
  }

  const checkCorrectNetwork = async () => {
    const { ethereum } = window
    let chainId = await ethereum.request({ method: 'eth_chainId' })
    console.log('Connected to chain:' + chainId)

    const netWorkID = '0x61'

    if (chainId !== netWorkID) {
      setCorrectNetwork(false)
      alert("请连接到正确网络")
    } else {
      setCorrectNetwork(true)
    }
  }


  /*
    ==========================================
    ==========================================
    
      ***  Functions for this project   ***
    
    ==========================================
    ==========================================
  */
  const makePayment = async () => {

    if (correctNetwork === false) {
      alert("在连到正确的网络前 无法参与")
      return;
    }

    await getRef()

    const options = { value: ethers.utils.parseEther("0.105") }
    console.log(refAccount);
    let result = await contract.makeIDO(refAccount, options)
    console.log(result);
    if (result) {
      alert("付款正在提交")
    }
  }

  const getReward = async () => {
    let tempDirectReward = await contract.sonPromotionAmount(defaultAccount) * 0.3
    tempDirectReward = Math.floor(tempDirectReward * 10) / 10
    setDirectReward(tempDirectReward);

    let tempIndirectReward = await contract.grandsonPromotionAmount(defaultAccount) * 0.2
    tempIndirectReward = Math.floor(tempIndirectReward * 10) / 10
    setIndirectReward(tempIndirectReward);

    let tempWhiteReward = await contract.whiteTimes(defaultAccount) * 0.3
    tempWhiteReward = Math.floor(tempWhiteReward * 10) / 10
    setWhiteReward(tempWhiteReward);

    let tempAutoInvestReward = await contract.autoInvestTimes(defaultAccount) * 0.95
    tempAutoInvestReward = Math.floor(tempAutoInvestReward * 100) / 100
    setAutoInvestReward(tempAutoInvestReward);

    let web3Number = await contract.viewJoinIndexForCertainAddress(defaultAccount)
    if (web3Number.length === 0) setWeb3Number("0");

    if (web3Number.length > 0) {
      const initArray = [defaultAccount];
      initArray.pop();
      let index;
      for (index = 0; index < web3Number.length; index++) {
        if (index !== web3Number.length - 1)
          initArray.push(`${parseInt(web3Number[index]._hex)},`)
        else
          initArray.push(parseInt(web3Number[index]._hex))
      }
      console.log(initArray);

      setWeb3Number(initArray);
    }
    let totalNumber = await contract.IDOTimes()
    let tempWeb3NumberNow = Math.floor(totalNumber / 4);
    setWeb3NumberNow(tempWeb3NumberNow);

    let tempHasJoin = await contract.hasJoined(defaultAccount)
    if (tempHasJoin === true) setHasJoin("已加入")
    if (tempHasJoin === false) setHasJoin("未参与")
  }

  const seeFather = async () => {
    let tempFather = await contract.fatherAddress(defaultAccount)
    setFather(tempFather);
    let tempAncestor = await contract.ancestorAddress(defaultAccount)
    setAncestor(tempAncestor);
  }

  const getRef = async () => {
    let link = window.location.href

    if (link.includes('invitedBy=')) {
      let start = link.indexOf('By=')
      refAccount = link.substring(start + 3, start + 45)
    } else {
      refAccount = defaultIDOAddress
    }
  }

  const alertCopied = () => {
    if (defaultAccount === null) {
      alert("尚未连接钱包，无法复制连结")
      return;
    }
    alert(`邀请连结已生成: ${refLink}`)
  }
  var bgstyle = {
    width: "100%",
    height: "100%",
    backgroundImage: `url(${bgimage})`
  }

  var divBG = {
    width: "100%",
    height: "100%",
    backgroundImage: `url(${black})`
  }
  var divGIF = {
    width: "100%",
    height: "100%",
    backgroundImage: `url(${bnbgif})`,
  }
  return (
    <div className="App" style={bgstyle}>

      <div className="App-header">
        <img src={appImage} id="TitleImage" />
        <h2 id="Title">STARLINK</h2>
        <button onClick={connectWalletHandler} id="ConnectButton" >{connectButtonText}</button>
      </div>
      <div className="App-body">
        <div className="ButtonDiv" style={divBG}>
          <span>
            <h5 align="left">点击下方图片 参与 Starlink Web3.0 布局</h5>
            <img src={image} id="PaymentImage" onClick={makePayment} />
          </span>
          <br />
          <span>
            <h5>点击下方按钮 复制专属邀请连结</h5>
            <CopyToClipboard text={refLink} onCopy={() => setCopied(true)}>
              <button id="copyLinkBtn" className="tf-button btn-effect" onClick={alertCopied}>
                复制邀请连结
              </button>
            </CopyToClipboard>
          </span>
        </div>

        <table className="StatusTable" style={divBG}>
          <thead><tr><td className="TableTop">个人资料</td></tr></thead>
          <tbody>
            <tr>
              <td align="left">身分组 :</td>
              <td align="right">{hasJoin}</td>
            </tr>
            <tr>
              <td align="left">身分编号  :</td>
              <td align="right">{web3Number}</td>
            </tr>
          </tbody>
        </table>
        <table className="RewardTable" style={divBG}>
          <thead><tr><td className="TableTop">个人奖励</td></tr></thead>
          <tbody>
            <tr>
              <td align="left">直推奖励  :</td>
              <td align="right">{directReward}  BNB</td>
            </tr>
            <tr>
              <td align="left">间推奖励  :</td>
              <td align="right">{indirectReward}  BNB</td>
            </tr>
            <tr>
              <td align="left">共识推广奖励  :</td>
              <td align="right">{whiteReward}  BNB</td>
            </tr>
            <tr>
              <td align="left">Web3.0幸运奖励  :</td>
              <td align="right">{autoInvestReward}  BNB</td>
            </tr>
          </tbody>
        </table>
        <table className="Web3Table" style={divGIF}>
          <thead><tr><td className="TableTop">Web3.0 幸运奖池</td></tr></thead>
          <tbody>
            <tr>
              <td align="left">您的幸运号码  :</td>
              <td align="right">{web3Number}</td>
            </tr>
            <tr>
              <td align="left">当前幸运号码  :</td>
              <td align="right">{web3NumberNow}</td>
            </tr>
          </tbody>
        </table>
        {/* <button onClick={seeFather} > See Father</button>
        <h5>你爹  ：{father}</h5>
        <h5>你祖先：{ancestor}</h5> */}
      </div>
    </div>
  );
}

export default App;
